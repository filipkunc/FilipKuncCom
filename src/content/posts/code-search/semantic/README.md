# Semantic code search

The embedding half of the [fast code search](../index.mdx) post: AST-aware
chunking, code embeddings, and an HNSW vector index over a source tree.

```sh
# build the index over a checkout (chunk -> embed on GPU -> HNSW)
uv run embed.py index /path/to/source

# ask a natural-language question, get the nearest code chunks
uv run embed.py search "where do we validate a TLS certificate"
```

`uv` pins the Python and the dependencies (see `pyproject.toml`). The default
model, [`jinaai/jina-code-embeddings-0.5b`](https://huggingface.co/jinaai/jina-code-embeddings-0.5b),
runs on a CUDA GPU. On a machine without one, drop the `[tool.uv.sources]` torch
index and pass `device="cpu"`, which will be slow. The index and chunk table are
written under `~/.cache/codesearch-bench/semantic/`.
