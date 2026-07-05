"""Capture the model's actual response to each loadgen prompt.

Same request shape as loadgen.py (max_tokens 1024, default sampling), one at
a time, saved as JSON for the post's prompt picker.
"""

import json
import pathlib

import httpx

from loadgen import PROMPTS

out = []
with httpx.Client(base_url="http://localhost:8000", timeout=300) as client:
    for prompt in PROMPTS:
        r = client.post("/v1/chat/completions", json={
            "model": "unsloth/qwen3.5-4b",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1024,
        })
        r.raise_for_status()
        d = r.json()
        c = d["choices"][0]
        out.append({
            "prompt": prompt,
            "thinking": (c["message"].get("reasoning") or "").strip(),
            "answer": (c["message"].get("content") or "").strip(),
            "completion_tokens": d["usage"]["completion_tokens"],
            "finish_reason": c["finish_reason"],
        })
        print(f"{c['finish_reason']:>6} {d['usage']['completion_tokens']:>5} tok  {prompt[:50]}")

path = pathlib.Path("capture/prompt-responses.json")
path.write_text(json.dumps(out, indent=1))
print("wrote", path)
