# Arena generator

Authoring-time only.
The `verify/` step does not touch this directory — readers don't need a GPU or weights to reproduce the scoreboard.

The post itself walks through the install and follow-along; this file is the short version for someone cloning the repo who just wants to regenerate the committed samples.

## Layout

- `prompt.md` — exact prompt sent to every model (committed, also rendered in the post)
- `call_model.py` — posts the prompt to a running `llama-server`, returns the response
- `generate.py` — loops over a hardcoded list of models, runs `call_model` per model, writes `verify/arena/samples/<model>/{solution.py,raw-response.txt}`

## Regenerating samples

1. Build llama.cpp with CUDA (see the post for the cmake commands), or use the copy Unsloth Studio drops at `~/.unsloth/llama.cpp/`.
2. Set `LLAMA_BIN` at the top of `generate.py` to point at your `llama-server` binary, then run it from this directory:

   ```sh
   python3 generate.py
   ```

   `huggingface_hub` will download any missing GGUFs to `~/.cache/huggingface/` on first run.

3. From the repo root: `npm run verify` — rebuilds `snippet-manifest.json` with the new scoreboard.

## Determinism

`call_model.py` sets `temperature=0`, `top_k=1`, `seed=42` and `llama-server` runs single-parallel, so a given (model, llama.cpp build, hardware) tuple is reproducible.
CPU vs GPU and different CUDA versions can still diverge; the committed samples are ground truth, `generate.py` just needs to be close enough that you can regenerate when updating the post.
