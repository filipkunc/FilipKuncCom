"""Capture a load scenario as post-ready JSON.

Runs a scenario command, then exports the aligned observability data:
- Prometheus range data (1s resolution) for the serving + GPU series
- the newest Jaeger trace for a given service (simplified span tree)
- the scenario's own stdout / per-request records

Usage:
  uv run capture.py overload -- uv run loadgen.py --requests 64 --concurrency 32 --max-tokens 1024
  uv run capture.py agent --trace-service agent -- uv run agent.py "Solve x^x = 10. ..."
"""

import argparse
import json
import pathlib
import subprocess
import sys
import time
import urllib.parse
import urllib.request

PROM = "http://localhost:9090"
JAEGER = "http://localhost:16686"

SERIES = [
    "vllm:kv_cache_usage_perc",
    "vllm:num_requests_running",
    "vllm:num_requests_waiting",
    "vllm:num_preemptions_total",
    "vllm:generation_tokens_total",
    "vllm:prompt_tokens_total",
    "nvml_gpu_utilization_percent",
    "nvml_memory_controller_utilization_percent",
    "nvml_power_watts",
    "nvml_memory_used_bytes",
    "nvml_memory_total_bytes",
]


def get_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def prom_range(expr: str, start: float, end: float) -> list:
    qs = urllib.parse.urlencode({"query": expr, "start": start, "end": end, "step": 1})
    result = get_json(f"{PROM}/api/v1/query_range?{qs}")["data"]["result"]
    if not result:
        return []
    return [[float(t), float(v)] for t, v in result[0]["values"]]


def newest_trace(service: str, start: float) -> dict | None:
    qs = urllib.parse.urlencode({"service": service, "limit": 1, "start": int(start * 1e6)})
    traces = get_json(f"{JAEGER}/api/traces?{qs}").get("data") or []
    if not traces:
        return None
    t = traces[0]
    svc = {pid: p["serviceName"] for pid, p in t["processes"].items()}
    spans = []
    for s in t["spans"]:
        refs = [r["spanID"] for r in s.get("references", [])]
        spans.append(
            {
                "id": s["spanID"],
                "parent": refs[0] if refs else None,
                "service": svc[s["processID"]],
                "op": s["operationName"],
                "start_us": s["startTime"],
                "dur_us": s["duration"],
                "tags": {x["key"]: x["value"] for x in s["tags"] if not x["key"].startswith("otel.")},
            }
        )
    spans.sort(key=lambda s: s["start_us"])
    return {"traceID": t["traceID"], "spans": spans}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name", help="scenario name, used for the output file")
    ap.add_argument("--trace-service", help="also export the newest Jaeger trace of this service")
    ap.add_argument("--out-dir", default="capture")
    ap.add_argument("--pad", type=float, default=5, help="seconds of metrics before/after the run")
    argv = sys.argv[1:]
    cmd = []
    if "--" in argv:
        split = argv.index("--")
        argv, cmd = argv[:split], argv[split + 1:]
    args = ap.parse_args(argv)
    if not cmd:
        sys.exit("no scenario command given (put it after --)")

    t0 = time.time()
    proc = subprocess.run(cmd, capture_output=True, text=True)
    t1 = time.time()
    print(proc.stdout, end="")
    if proc.returncode != 0:
        print(proc.stderr, end="", file=sys.stderr)
        sys.exit(f"scenario failed with exit code {proc.returncode}")

    time.sleep(args.pad + 2)  # let the last scrapes and span batches land
    start, end = t0 - args.pad, t1 + args.pad

    capture = {
        "name": args.name,
        "captured_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "cmd": cmd,
        "t0": t0,
        "t1": t1,
        "stdout": proc.stdout,
        "metrics": {expr: prom_range(expr, start, end) for expr in SERIES},
    }
    if args.trace_service:
        capture["trace"] = newest_trace(args.trace_service, t0)

    out = pathlib.Path(args.out_dir)
    out.mkdir(exist_ok=True)
    path = out / f"{args.name}.json"
    path.write_text(json.dumps(capture, indent=1))
    points = sum(len(v) for v in capture["metrics"].values())
    spans = len(capture.get("trace", {}).get("spans", [])) if args.trace_service else 0
    print(f"\nwrote {path} ({points} metric points, {spans} trace spans)")


if __name__ == "__main__":
    main()
