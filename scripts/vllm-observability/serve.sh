#!/usr/bin/env bash
# vLLM with Prometheus metrics (built-in at /metrics) and OTel traces to Jaeger.
# The observability stack must be up first: podman compose up -d
set -euo pipefail
cd "$(dirname "$0")"

MODEL="${MODEL:-unsloth/qwen3.5-4b}"

# FlashInfer JIT-compiles kernels at startup; CUDA 13.2 rejects Fedora 44's
# gcc 16 as host compiler, so point nvcc at the gcc15 compat package.
export NVCC_PREPEND_FLAGS='-ccbin /usr/bin/g++-15'

# vLLM does not set an OTel service name; without this, traces land in
# Jaeger under "unknown_service".
export OTEL_SERVICE_NAME=vllm

exec uv run vllm serve "$MODEL" \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.7 \
  --max-num-seqs 32 \
  --max-num-batched-tokens 4096 \
  --limit-mm-per-prompt '{"image": 0, "video": 0}' \
  --enable-auto-tool-choice \
  --tool-call-parser qwen3_xml \
  --reasoning-parser qwen3 \
  --otlp-traces-endpoint grpc://localhost:4317 \
  --collect-detailed-traces all \
  --port 8000
