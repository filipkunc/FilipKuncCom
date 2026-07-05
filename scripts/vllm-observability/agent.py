"""Minimal tool-calling agent against the local vLLM endpoint.

Gives the model a `python` tool executed in a network-less podman container.
The whole session is one OTel trace: agent.solve -> llm.call / tool.python
spans, with vLLM's llm_request spans as children of each llm.call.
"""

import argparse
import json
import subprocess
import sys

import httpx
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

provider = TracerProvider(resource=Resource.create({"service.name": "agent"}))
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="localhost:4317", insecure=True)))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("agent")

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "python",
            "description": "Execute Python code in a sandbox and return its stdout. "
            "Use print() to output results. No network access.",
            "parameters": {
                "type": "object",
                "properties": {"code": {"type": "string", "description": "Python source to run"}},
                "required": ["code"],
            },
        },
    }
]


def run_python(code: str) -> str:
    with tracer.start_as_current_span("tool.python") as span:
        span.set_attribute("code", code.strip()[:1500])
        try:
            # #region sandbox
            proc = subprocess.run(
                ["podman", "run", "--rm", "-i", "--network=none", "--memory=256m",
                 "--pids-limit=64", "docker.io/library/python:3.12-alpine", "python", "-"],
                input=code.encode(), capture_output=True, timeout=60,
            )
            # #endregion
        except subprocess.TimeoutExpired:
            span.set_attribute("stdout", "error: execution timed out after 60s")
            return "error: execution timed out after 60s"
        out = proc.stdout.decode(errors="replace")
        err = proc.stderr.decode(errors="replace")
        result = (out + ("\n" + err if err else "")).strip() or "(no output)"
        span.set_attribute("stdout", result[:800])
        return result


def llm_call(client: httpx.Client, model: str, messages: list, max_tokens: int) -> dict:
    with tracer.start_as_current_span("llm.call") as span:
        headers = {}
        TraceContextTextMapPropagator().inject(headers)
        resp = client.post(
            "/v1/chat/completions",
            headers=headers,
            json={
                "model": model,
                "messages": messages,
                "tools": TOOLS,
                "max_tokens": max_tokens,
                "temperature": 0.6,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        # Record what the model decided, so the span is readable on its own.
        msg = data["choices"][0]["message"]
        span.set_attribute("completion_tokens", data["usage"]["completion_tokens"])
        thinking = msg.get("reasoning") or msg.get("reasoning_content")
        if thinking:
            span.set_attribute("thinking", thinking.strip()[:900])
        if msg.get("tool_calls"):
            code = json.loads(msg["tool_calls"][0]["function"]["arguments"]).get("code", "")
            span.set_attribute("decision", "call the python tool")
            span.set_attribute("tool_call.code", code.strip()[:1500])
        else:
            span.set_attribute("decision", "answer directly")
            span.set_attribute("answer", (msg.get("content") or "").strip()[:600])
        return data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("task", nargs="?", default="Solve x^x = 10. Give the numeric answer to 10 decimal places.")
    ap.add_argument("--base-url", default="http://localhost:8000")
    ap.add_argument("--model", default="unsloth/qwen3.5-4b")
    ap.add_argument("--max-steps", type=int, default=8)
    ap.add_argument("--max-tokens", type=int, default=6000)
    args = ap.parse_args()

    messages = [
        {"role": "system", "content": "You have a python tool. Use it for any numeric computation instead of computing by hand."},
        {"role": "user", "content": args.task},
    ]

    with tracer.start_as_current_span("agent.solve") as root:
        root.set_attribute("task", args.task)
        with httpx.Client(base_url=args.base_url, timeout=600) as client:
            for step in range(1, args.max_steps + 1):
                data = llm_call(client, args.model, messages, args.max_tokens)
                msg = data["choices"][0]["message"]
                finish = data["choices"][0]["finish_reason"]
                usage = data["usage"]["completion_tokens"]
                # Thinking is recorded on the span; never send it back as history.
                messages.append({k: v for k, v in msg.items() if k not in ("reasoning", "reasoning_content")})

                if msg.get("tool_calls"):
                    for tc in msg["tool_calls"]:
                        try:
                            code = json.loads(tc["function"]["arguments"])["code"]
                        except (json.JSONDecodeError, KeyError, TypeError) as e:
                            print(f"--- step {step}: unparseable tool call ---")
                            messages.append({"role": "tool", "tool_call_id": tc["id"],
                                             "content": f"error: could not parse tool arguments ({e})"})
                            continue
                        print(f"--- step {step}: tool call ({usage} tokens) ---")
                        print(code.strip())
                        result = run_python(code)
                        print(f"--- output ---\n{result}")
                        messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result})
                else:
                    print(f"--- step {step}: final answer (finish={finish}, {usage} tokens) ---")
                    print(msg.get("content") or "(empty)")
                    break
            else:
                print("hit max steps without a final answer")

    provider.force_flush()


if __name__ == "__main__":
    main()
