# Qwen GPU observability capture

This directory documents the capture behind the post “Watching one Qwen3.8 run on my GPU.” It is deliberately not a general benchmark: it describes one three-turn tool-calling session on one RTX 5070 Ti.

## What is committed

- [`capture-manifest.json`](capture-manifest.json) records the model, tool versions, inference windows, and SHA-256 hashes of the raw artifacts.
- [`summarize.py`](summarize.py) contains the name-based CUDA-kernel classification used by the article.
- The chart-ready one-second telemetry and per-turn summary live in [`../../src/content/posts/qwen-gpu-under-the-hood/capture.json`](../../src/content/posts/qwen-gpu-under-the-hood/capture.json).

The 87 MB Nsight report and its 301 MB exported SQLite database are not committed. Their hashes are retained in the manifest so a separately shared copy can be checked against this analysis. The API responses are also omitted because they contain the model's long reasoning transcript; their hashes are recorded.

## Capture setup

Unsloth Studio printed the server command it generated. The relevant arguments were:

```sh
llama-server \
  -m Qwen3.8-27B-UD-IQ2_S.gguf \
  --port 47529 \
  --parallel 4 \
  --flash-attn on \
  --no-context-shift \
  -c 29440 \
  --alias unsloth/Qwen3.8-27B-GGUF \
  -ngl -1 \
  --fit off \
  --metrics \
  --kv-unified \
  --jinja \
  --spec-default
```

For the clean capture, the same bundled server was started directly under Nsight Systems. The surrounding command was equivalent to:

```sh
nsys profile \
  --trace=cuda,nvtx,osrt \
  --cuda-graph-trace=node \
  --output=/tmp/qwen-profiled-llama \
  llama-server [arguments above]
```

The server arguments came from the Studio log. The short Nsight command above is a reconstruction of the shell invocation, because the shell command itself was not saved as a capture artifact. GPU utilization, memory, power and temperature were sampled every 100 ms with `nvidia-smi`; the article aggregates those samples to one-second points.

The prompt was:

```text
system: You have a Python tool. Use it for numeric computation instead of computing by hand.
user:   Solve x^x = 10
```

Python tool calls ran in a disposable Python 3.12 container with networking disabled.

## Re-running the classifier

Export the Nsight report to SQLite, then run:

```sh
nsys export --type sqlite --output qwen-profiled-llama.sqlite qwen-profiled-llama.nsys-rep
python3 summarize.py \
  --trace qwen-profiled-llama.sqlite \
  --gpu-csv qwen-direct-profiled-gpu.csv \
  --manifest capture-manifest.json
```

The categories are string matches over demangled kernel names, not labels emitted by Qwen or llama.cpp. In particular, `set_rows` is kept as `set_rows`: llama.cpp uses that operation for KV writes, but it also occurs elsewhere. Treating every matching launch as a semantic KV-cache event would overstate what the trace proves.

