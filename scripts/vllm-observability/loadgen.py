"""Async load generator for an OpenAI-compatible endpoint.

Streams completions and measures client-side TTFT / TPOT / e2e latency,
to cross-check against what vLLM's own metrics report.
"""

import argparse
import asyncio
import json
import statistics
import time

import httpx
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

provider = TracerProvider(resource=Resource.create({"service.name": "loadgen"}))
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="localhost:4317", insecure=True)))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("loadgen")

# #region prompts
PROMPTS = [
    "Explain how a hash map handles collisions.",
    "Write a Python function that inverts a binary tree.",
    "What is the difference between a process and a thread?",
    "Describe how TCP congestion control works.",
    "Write a SQL query that finds duplicate emails in a users table.",
    "Explain what a bloom filter is and when to use one.",
    "How does garbage collection work in a generational collector?",
    "Write a regex that matches ISO 8601 dates.",
]
# #endregion


async def one_request(client: httpx.AsyncClient, model: str, prompt: str, max_tokens: int) -> dict:
    start_ts = time.time()
    start = time.perf_counter()
    ttft = None
    tokens = 0
    with tracer.start_as_current_span("loadgen.request") as span:
        headers = {}
        TraceContextTextMapPropagator().inject(headers)
        async with client.stream(
            "POST",
            "/v1/chat/completions",
            headers=headers,
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "stream": True,
            },
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: ") or line == "data: [DONE]":
                    continue
                chunk = json.loads(line[len("data: "):])
                delta = chunk["choices"][0]["delta"] if chunk["choices"] else {}
                if delta.get("content"):
                    if ttft is None:
                        ttft = time.perf_counter() - start
                        span.add_event("first_token")
                    tokens += 1
    e2e = time.perf_counter() - start
    tpot = (e2e - ttft) / max(tokens - 1, 1) if ttft is not None else None
    return {"start": start_ts, "ttft": ttft, "e2e": e2e, "tokens": tokens, "tpot": tpot}


async def worker(client, model, max_tokens, queue, results):
    while True:
        i = await queue.get()
        if i is None:
            return
        prompt = PROMPTS[i % len(PROMPTS)]
        try:
            results.append(await one_request(client, model, prompt, max_tokens))
        except httpx.HTTPError as e:
            results.append({"error": str(e)})


def pct(values, p):
    values = sorted(values)
    return values[min(int(len(values) * p / 100), len(values) - 1)]


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://localhost:8000")
    ap.add_argument("--model", default="unsloth/qwen3.5-4b")
    ap.add_argument("--requests", type=int, default=32)
    ap.add_argument("--concurrency", type=int, default=8)
    ap.add_argument("--max-tokens", type=int, default=256)
    ap.add_argument("--json-out", help="write per-request records to this file")
    args = ap.parse_args()

    queue = asyncio.Queue()
    for i in range(args.requests):
        queue.put_nowait(i)
    for _ in range(args.concurrency):
        queue.put_nowait(None)

    results = []
    wall_start = time.perf_counter()
    async with httpx.AsyncClient(base_url=args.base_url, timeout=300) as client:
        await asyncio.gather(*[
            worker(client, args.model, args.max_tokens, queue, results)
            for _ in range(args.concurrency)
        ])
    wall = time.perf_counter() - wall_start

    ok = [r for r in results if "error" not in r]
    errors = [r for r in results if "error" in r]
    ttfts = [r["ttft"] for r in ok if r["ttft"] is not None]
    tpots = [r["tpot"] for r in ok if r["tpot"] is not None]
    total_tokens = sum(r["tokens"] for r in ok)

    print(f"requests: {len(ok)} ok, {len(errors)} failed, wall {wall:.1f}s")
    print(f"throughput: {total_tokens / wall:.1f} output tok/s, {len(ok) / wall:.2f} req/s")
    if ttfts:
        print(f"ttft  p50 {pct(ttfts, 50)*1000:.0f}ms  p90 {pct(ttfts, 90)*1000:.0f}ms  p99 {pct(ttfts, 99)*1000:.0f}ms")
    if tpots:
        print(f"tpot  p50 {pct(tpots, 50)*1000:.1f}ms  p90 {pct(tpots, 90)*1000:.1f}ms  mean {statistics.mean(tpots)*1000:.1f}ms")
    for e in errors[:3]:
        print("error:", e["error"])
    if args.json_out:
        with open(args.json_out, "w") as f:
            json.dump({"config": vars(args), "wall": wall, "requests": results}, f, indent=1)
    provider.force_flush()


if __name__ == "__main__":
    asyncio.run(main())
