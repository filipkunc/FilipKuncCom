"""Send a prompt to a locally running llama-server, return the response.

Start the server first:
    llama-server -m <model.gguf> --port 8123 -c 8192 -ngl 99 -np 1
"""

import json
import re
import urllib.request


def call(prompt: str, *, port: int = 8123, temperature: float = 0, top_k: int = 1, seed: int = 42,
         enable_thinking: bool | None = None) -> tuple[str, dict]:
    """Returns (response_text, timings). `timings` is llama.cpp's per-call
    speed breakdown: predicted_n, predicted_per_second, predicted_ms, etc.

    `enable_thinking` forwards to the chat template via `chat_template_kwargs`
    so Qwen3-class models can be run with or without their default reasoning trace.
    Leave as None for models that don't have a thinking mode (e.g. Gemma)."""
    payload = {
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "top_k": top_k,
        "seed": seed,
    }
    if enable_thinking is not None:
        payload["chat_template_kwargs"] = {"enable_thinking": enable_thinking}
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"http://127.0.0.1:{port}/v1/chat/completions",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read())
    return data["choices"][0]["message"]["content"], data.get("timings", {})


def extract_python(raw: str) -> str:
    m = re.search(r"```(?:python)?\s*\n(.*?)```", raw, re.DOTALL)
    return (m.group(1).rstrip() + "\n") if m else raw
