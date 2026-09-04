# Qwen3.8 teaching capture

This is a second, deliberately instrumented run made on 2026-09-04. It does not replace the clean Nsight capture from 2026-09-03. The clean capture measures performance; this one records what entered selected points in the network.

## What is here

- `request-*.json` and `response-*.json` are the complete two-turn OpenAI-compatible exchange. Reasoning is included because it becomes part of the next prompt.
- `template-*.json` is llama.cpp's exact `/apply-template` output.
- `tokens-*.json` contains every token ID and piece returned by `/tokenize` with `parse_special: true`.
- `tool-01.py` is the model's verbatim tool payload. `tool-output-01.txt` was produced by Python 3.12 in a disposable container with networking disabled.
- `gguf-metadata.json` is a metadata-only dump from the exact GGUF. The local path was replaced with the basename.
- `layer-checkpoints.log` is the output of the patched `llama-debug` pass over `rendered-prompt-01.txt`.
- `llama-debug-teaching.patch` is the complete llama.cpp modification.
- `build-teaching-data.py` turns the raw files into the smaller `teaching-capture.json` used by the article.
- `manifest.json` records sizes and SHA-256 hashes for the committed capture files.

The model file is not committed. It is `Qwen3.8-27B-UD-IQ2_S.gguf`, 8,371,970,048 bytes, SHA-256 `7897d2c5a5cee46aef50895141b2c8a0803c1185f3d03c4fda4cd137a7ad77fe`.

## Exact software

- source: `https://github.com/unslothai/llama.cpp`
- commit: `92cedc8679d145902ead3f006258e8672eac11e6`
- llama.cpp version: `0.3.0-dev`, build 10715
- compiler: GCC/G++ 15.3.1
- CUDA toolkit: 13.3.73
- GPU target: `120a`
- GPU: NVIDIA GeForce RTX 5070 Ti, 16,303 MiB reported by NVML

## Build the instrumented tools

From a clean checkout of the commit above:

```sh
git apply /path/to/capture-v2/llama-debug-teaching.patch

cmake -S . -B build-teaching -G Ninja \
  -DCMAKE_C_COMPILER=/usr/bin/gcc-15 \
  -DCMAKE_CXX_COMPILER=/usr/bin/g++-15 \
  -DCMAKE_CUDA_HOST_COMPILER=/usr/bin/g++-15 \
  -DCMAKE_CUDA_ARCHITECTURES=120 \
  -DGGML_CUDA=ON \
  -DGGML_NATIVE=ON \
  -DGGML_CCACHE=OFF \
  -DLLAMA_BUILD_TESTS=OFF \
  -DLLAMA_BUILD_EXAMPLES=ON \
  -DLLAMA_BUILD_SERVER=ON \
  -DCMAKE_BUILD_TYPE=Release

cmake --build build-teaching --target llama-tokenize llama-debug llama-server --parallel 16
```

The patch makes three small changes:

1. a tensor filter prevents unrelated GPU tensors from being copied to the CPU;
2. selected tensors print count, mean, RMS, minimum and maximum;
3. `llama-debug` preserves the prompt file byte-for-byte, parses special chat tokens like the server and prints the ten largest final logits.

Without the third change, stock `llama-debug` strips the prompt's final newline and treats `<|im_start|>` as ordinary characters. The same-looking prompt then becomes 396 tokens instead of the server's 373.

## Run the local server

```sh
build-teaching/bin/llama-server \
  -m /path/to/Qwen3.8-27B-UD-IQ2_S.gguf \
  --host 127.0.0.1 \
  --port 47530 \
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

Post `request-01.json` to `/apply-template`, `/tokenize` and `/v1/chat/completions` in that order. Review the returned Python before running it. The recorded payload was executed with:

```sh
podman run --rm --network none -i \
  docker.io/library/python:3.12-alpine \
  python -I - < tool-01.py
```

Append the assistant response and tool result exactly as shown in `request-02.json`, then repeat the three HTTP calls. Temperature was zero and seed was 42, but GPU inference is not promised to be bit-for-bit deterministic.

## Capture selected tensors

Stop the server first so the debug process can load the model. The command used `GGML_CUDA_DISABLE_GRAPHS=1`, the exact `rendered-prompt-01.txt`, `--no-warmup`, and these anchored tensor filters:

```text
model.input_embed
linear_attn_qkv_mixed-0
q_conv_predelta-0, k_conv_predelta-0, v_conv_predelta-0
linear_attn_out-0, attn_residual-0, ffn_out-0, l_out-0
Qcur-3, Kcur-3, Vcur-3
attn_pregate-3, attn_output-3, attn_residual-3, ffn_out-3, l_out-3
l_out-63, result_norm, result_output
```

Each filter was passed as its own `--tensor-filter 'name$'` argument. The complete stdout is committed in `layer-checkpoints.log`; it includes the command's 373 token IDs and the top logits.

Finally rebuild the browser data and hashes:

```sh
python3 scripts/qwen-gpu-observability/capture-v2/build-teaching-data.py
```

## What this proves

The GGUF proves the architecture metadata. The patched diagnostic proves that tensors with the recorded names and shapes were evaluated for this prompt, and records numerical summaries of their contents. It does not prove what an individual dimension “means.” It also does not provide honest per-layer timing: GPU-to-CPU copies introduce synchronization and disable the fast execution path.
