#!/usr/bin/env python3
"""Build the small, browser-facing teaching capture from the raw v2 files."""

from __future__ import annotations

import json
import hashlib
import re
from pathlib import Path


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUTPUT = REPO / "src/content/posts/qwen-gpu-under-the-hood/teaching-capture.json"
MANIFEST = HERE / "manifest.json"


def read_json(name: str) -> dict:
    return json.loads((HERE / name).read_text())


def metadata_value(metadata: dict, key: str):
    return metadata[key]["value"]


def find_subsequence(items: list[dict], pieces: list[str]) -> list[dict]:
    for start in range(len(items) - len(pieces) + 1):
        if [item["piece"] for item in items[start : start + len(pieces)]] == pieces:
            return items[start : start + len(pieces)]
    raise ValueError(f"token piece sequence not found: {pieces!r}")


def parse_checkpoints(text: str) -> list[dict]:
    header = re.compile(
        r"^common_debug_cb_eval:\s+(?P<name>\S+) = \((?P<type>[^)]+)\)\s+"
        r"(?P<op>[A-Z0-9_]+)\(.*\) = \{(?P<shape>[^}]+)\}$"
    )
    summary = re.compile(
        r"^\s+summary count=(?P<count>\d+) mean=(?P<mean>\S+) "
        r"rms=(?P<rms>\S+) min=(?P<min>\S+) max=(?P<max>\S+)$"
    )
    lines = text.splitlines()
    result = []
    for index, line in enumerate(lines[:-1]):
        match = header.match(line)
        values = summary.match(lines[index + 1]) if match else None
        if not match or not values:
            continue
        result.append(
            {
                "name": match["name"],
                "type": match["type"],
                "operation": match["op"],
                "shape": [int(part.strip()) for part in match["shape"].split(",")],
                "count": int(values["count"]),
                "mean": float(values["mean"]),
                "rms": float(values["rms"]),
                "min": float(values["min"]),
                "max": float(values["max"]),
            }
        )
    return result


def parse_top_logits(text: str) -> list[dict]:
    pattern = re.compile(
        r"^\s*(?P<rank>\d+)\s+id=\s*(?P<id>\d+)\s+"
        r"logit=\s*(?P<logit>-?[\d.]+)\s+piece=(?P<piece>.*)$"
    )
    result = []
    in_section = False
    for line in text.splitlines():
        if line.startswith("Top logits ("):
            in_section = True
            continue
        if not in_section:
            continue
        match = pattern.match(line)
        if not match:
            if result:
                break
            continue
        result.append(
            {
                "rank": int(match["rank"]),
                "id": int(match["id"]),
                "logit": float(match["logit"]),
                "piece": match["piece"],
            }
        )
    return result


def main() -> None:
    tokens_1 = read_json("tokens-01.json")["tokens"]
    tokens_2 = read_json("tokens-02.json")["tokens"]
    response_1 = read_json("response-01.json")
    response_2 = read_json("response-02.json")
    gguf = read_json("gguf-metadata.json")
    metadata = gguf["metadata"]
    checkpoint_log = (HERE / "layer-checkpoints.log").read_text()

    starts = [index for index, token in enumerate(tokens_1) if token["id"] == 248045]
    if len(starts) != 3:
        raise ValueError(f"expected three <|im_start|> tokens, found {len(starts)}")

    query_pieces = ["S", "olve", " x", "^", "x", " =", " ", "1", "0"]
    query_tokens = find_subsequence(tokens_1, query_pieces)

    architecture = {
        "layers": metadata_value(metadata, "qwen35.block_count"),
        "contextLength": metadata_value(metadata, "qwen35.context_length"),
        "hiddenSize": metadata_value(metadata, "qwen35.embedding_length"),
        "intermediateSize": metadata_value(metadata, "qwen35.feed_forward_length"),
        "queryHeads": metadata_value(metadata, "qwen35.attention.head_count"),
        "kvHeads": metadata_value(metadata, "qwen35.attention.head_count_kv"),
        "headSize": metadata_value(metadata, "qwen35.attention.key_length"),
        "fullAttentionInterval": metadata_value(metadata, "qwen35.full_attention_interval"),
        "recurrent": {
            "convKernel": metadata_value(metadata, "qwen35.ssm.conv_kernel"),
            "stateSize": metadata_value(metadata, "qwen35.ssm.state_size"),
            "groups": metadata_value(metadata, "qwen35.ssm.group_count"),
            "valueHeads": metadata_value(metadata, "qwen35.ssm.time_step_rank"),
            "innerSize": metadata_value(metadata, "qwen35.ssm.inner_size"),
        },
        "vocabSize": len(metadata["tokenizer.ggml.tokens"].get("value", [])) or 248320,
    }

    data = {
        "provenance": {
            "date": "2026-09-04",
            "model": "Qwen3.8-27B",
            "modelFile": Path(gguf["filename"]).name,
            "modelSha256": "7897d2c5a5cee46aef50895141b2c8a0803c1185f3d03c4fda4cd137a7ad77fe",
            "quantization": "UD-IQ2_S",
            "llamaCppCommit": "92cedc8679d145902ead3f006258e8672eac11e6",
            "cudaArchitecture": "120a",
            "checkpointScope": "one diagnostic prefill over the exact first rendered prompt",
        },
        "question": "Solve x^x = 10",
        "tokenizer": {
            "model": metadata_value(metadata, "tokenizer.ggml.model"),
            "preprocessor": metadata_value(metadata, "tokenizer.ggml.pre"),
            "promptTokenCount": len(tokens_1),
            "secondPromptTokenCount": len(tokens_2),
            "segments": [
                {"id": "setup", "label": "reasoning + tool setup", "start": starts[0], "end": starts[1]},
                {"id": "user", "label": "visible user turn", "start": starts[1], "end": starts[2]},
                {"id": "assistant", "label": "assistant opening", "start": starts[2], "end": len(tokens_1)},
            ],
            "queryTokens": query_tokens,
            "tokens": tokens_1,
        },
        "architecture": architecture,
        "layers": [
            {
                "index": index,
                "kind": "attention" if (index + 1) % architecture["fullAttentionInterval"] == 0 else "recurrent",
            }
            for index in range(architecture["layers"])
        ],
        "checkpoints": parse_checkpoints(checkpoint_log),
        "topLogits": parse_top_logits(checkpoint_log),
        "session": {
            "turns": [
                {
                    "id": "turn-1",
                    "promptTokens": response_1["usage"]["prompt_tokens"],
                    "cachedTokens": response_1["usage"]["prompt_tokens_details"]["cached_tokens"],
                    "outputTokens": response_1["usage"]["completion_tokens"],
                    "promptMs": response_1["timings"]["prompt_ms"],
                    "decodeMs": response_1["timings"]["predicted_ms"],
                    "tokensPerSecond": response_1["timings"]["predicted_per_second"],
                    "finishReason": response_1["choices"][0]["finish_reason"],
                },
                {
                    "id": "turn-2",
                    "promptTokens": response_2["usage"]["prompt_tokens"],
                    "cachedTokens": response_2["usage"]["prompt_tokens_details"]["cached_tokens"],
                    "outputTokens": response_2["usage"]["completion_tokens"],
                    "promptMs": response_2["timings"]["prompt_ms"],
                    "decodeMs": response_2["timings"]["predicted_ms"],
                    "tokensPerSecond": response_2["timings"]["predicted_per_second"],
                    "finishReason": response_2["choices"][0]["finish_reason"],
                },
            ],
            "tool": {
                "code": (HERE / "tool-01.py").read_text(),
                "output": (HERE / "tool-output-01.txt").read_text(),
            },
            "answer": response_2["choices"][0]["message"]["content"],
        },
    }

    OUTPUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    artifact_names = [
        "request-01.json",
        "request-02.json",
        "response-01.json",
        "response-02.json",
        "template-01.json",
        "template-02.json",
        "tokenize-request-01.json",
        "tokenize-request-02.json",
        "tokens-01.json",
        "tokens-02.json",
        "rendered-prompt-01.txt",
        "tool-01.py",
        "tool-output-01.txt",
        "gguf-metadata.json",
        "layer-checkpoints.log",
        "llama-debug-teaching.patch",
    ]
    manifest = {
        "capture": "Qwen3.8 teaching rerun",
        "date": "2026-09-04",
        "modelSha256": data["provenance"]["modelSha256"],
        "artifacts": [],
    }
    for name in artifact_names:
        payload = (HERE / name).read_bytes()
        manifest["artifacts"].append(
            {"name": name, "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()}
        )
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(OUTPUT)


if __name__ == "__main__":
    main()
