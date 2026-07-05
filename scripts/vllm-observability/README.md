# vLLM + observability playground

Local exploration of LLM serving observability: vLLM native on the host GPU,
Prometheus + Grafana + Jaeger in rootless podman.

## Run

```sh
podman compose up -d              # prometheus :9090, grafana :3000, jaeger :16686
./serve.sh                        # vLLM on :8000, /metrics + OTel traces to jaeger
uv run nvml_exporter.py           # GPU metrics on :9835 (DCGM stand-in)
uv run loadgen.py --requests 32 --concurrency 8
uv run agent.py "Solve x^x = 10. Give the numeric answer to 10 decimal places."
```

- Grafana: http://localhost:3000/d/vllm-serving (anonymous admin, local only)
- Prometheus: http://localhost:9090
- Jaeger UI: http://localhost:16686

The `vllm serving` dashboard is provisioned from
`grafana/provisioning/dashboards/vllm.json`.

## Load scenarios

- Light (no queueing): `--requests 32 --concurrency 8 --max-tokens 256`
- Overload (KV cache saturation, preemptions, capacity queueing):
  `--requests 64 --concurrency 32 --max-tokens 1024`
  KV cache is ~33.6k tokens, so 32 concurrent x 1k-token generations saturate
  it: expect kv_cache_usage ~99%, preemptions, waiting reason="capacity",
  and TTFT p50 in the tens of seconds while TPOT stays ~15 ms.

## Capturing data for the post

`capture.py` runs a scenario and exports post-ready JSON to `capture/`:
1s-resolution Prometheus range data for the serving + GPU series, the
scenario stdout, and optionally the newest Jaeger trace as a simplified
span tree. Scrape interval is 1s for this reason.

```sh
uv run capture.py overload -- uv run loadgen.py --requests 64 --concurrency 32 \
  --max-tokens 1024 --json-out capture/overload-requests.json
uv run capture.py agent --trace-service agent -- uv run agent.py "Solve x^x = 10. ..."
```

Presentation plan (site conventions: own SVG components, no dashboard
screenshots): a scrubbable metrics-replay timeline fed by overload.json, a
trace waterfall fed by agent.json (tap a span for its gen_ai.* attributes),
and captured stdout for the terminal parts.

## Gotchas found on the way (Fedora 44, RTX 5070 Ti 16 GB)

- FlashInfer JIT-compiles kernels at first startup with nvcc. CUDA 13.2
  rejects gcc 16 as host compiler; fix is the `gcc15` compat package plus
  `NVCC_PREPEND_FLAGS='-ccbin /usr/bin/g++-15'` (in serve.sh). First startup
  takes ~10 min compiling; later startups reuse `~/.cache/flashinfer`.
- Qwen3.5-4B is a VL model. Profiling the vision encoder at default batch
  limits OOMs a 16 GB card even though the weights are only 8 GB. Fix:
  `--limit-mm-per-prompt '{"image": 0, "video": 0}'` plus modest
  `--max-num-seqs` / `--max-num-batched-tokens`.
- The desktop (GNOME/Chrome) holds a fluctuating 1-2.5 GB of VRAM that vLLM's
  `--gpu-memory-utilization` accounting does not see; leave slack (0.7 here).
- vLLM sets no OTel resource attributes; without `OTEL_SERVICE_NAME` traces
  land in Jaeger as `unknown_service`.
- Prometheus in a container with a single-file bind mount does not see host
  edits after `Write` (inode swap); restart the container instead of relying
  on `/-/reload`.
- The OTLP span exporter batches with a ~5 s delay; querying Jaeger right
  after a request races it.

## Traces

`--otlp-traces-endpoint grpc://localhost:4317 --collect-detailed-traces all`
gives one `llm_request` span per request with `gen_ai.*` attributes,
including a queue/prefill/decode latency split. W3C `traceparent` from the
client is honored: loadgen opens a `loadgen.request` root span and vLLM's
`llm_request` becomes its child (visible in Jaeger as a two-service trace).

## Tool-calling agent

serve.sh enables `--enable-auto-tool-choice --tool-call-parser qwen3_xml`.
`agent.py` gives the model a `python` tool executed in a network-less podman
container (`python:3.12-alpine`, stdin-fed, memory/pids-limited) and traces
the whole session: `agent.solve` -> `llm.call` -> vLLM `llm_request`, with
`tool.python` spans in between.

The x^x = 10 experiment that motivated it: without tools the model burns
6k-8k thinking tokens on longhand Newton iteration and still gets only 4
decimals right (or answers "6 decimal places" with 4 correct when thinking is
disabled). With the python tool it writes Newton's method, recovers from a
missing-mpmath import error, and returns 2.5061841456 — exact to 10 decimals —
in 3 steps / ~765 completion tokens. `finished_reason` counters and the span
tree make the difference directly visible.

Gap notes vs the OTel GenAI semconv (for the post):

- span name is `llm_request`, spec says `chat {model}`
- `gen_ai.usage.prompt_tokens` / `completion_tokens` are the pre-1.x names;
  spec renamed them to `input_tokens` / `output_tokens`
- `gen_ai.latency.*` attributes are vLLM-specific (and genuinely useful)
- no `gen_ai.request.model` / `gen_ai.system` / `gen_ai.response.*`
