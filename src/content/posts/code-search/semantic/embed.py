"""Semantic code search: AST-aware chunking, code embeddings, an HNSW index.

    uv run embed.py index <source-dir>     # chunk, embed, build the index
    uv run embed.py search "<question>"    # nearest chunks to a question

The exact-search half of the post turns a regex into a trigram query. This is the
other half: turn every chunk of code into a vector, turn the question into a
vector, and let nearness in that space stand in for "related concept". It finds
code that shares no words with the query, which a trigram index can never do, and
in exchange it cannot promise an exact match and goes stale the moment code
changes.

Three pieces matter and each is swappable:
  - chunking:   split on syntax (functions, classes) with tree-sitter, not on
                line counts, so a chunk is a coherent unit of code.
  - embedding:  a code-specific model (Jina's v2 code model, 768 dimensions),
                run on the GPU.
  - index:      FAISS IndexHNSWFlat, the hierarchical-navigable-small-world graph
                that answers nearest-neighbour queries in roughly log time.
"""

import sys
import time
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from tree_sitter_language_pack import get_parser

MODEL = "jinaai/jina-code-embeddings-0.5b"   # Qwen2.5-Coder-0.5B backbone, Aug 2025
DIM = 896
MAX_CHARS = 1500           # ~a few hundred tokens per chunk
MAX_DEPTH = 40             # stop recursing into pathologically nested ASTs
CACHE = Path.home() / ".cache/codesearch-bench/semantic"

# The model is instruction-tuned: code and the natural-language question get
# different prefixes so a query and its answer land near each other even though
# they read nothing alike. sentence-transformers applies these via prompt_name.
QUERY_PROMPT = "nl2code_query"
DOC_PROMPT = "nl2code_document"

# Extension -> tree-sitter grammar. Anything else falls back to line chunks.
LANGS = {
    ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".ts": "typescript", ".jsx": "javascript", ".tsx": "tsx",
    ".c": "c", ".h": "c", ".cc": "cpp", ".cpp": "cpp", ".cxx": "cpp",
    ".hpp": "cpp", ".hh": "cpp", ".py": "python", ".go": "go",
    ".rs": "rust", ".java": "java",
}
SKIP_DIRS = {".git", "node_modules", "out", "build"}


class Chunk:
    __slots__ = ("path", "start", "end", "text")

    def __init__(self, path, start, end, text):
        self.path, self.start, self.end, self.text = path, start, end, text


# #region chunk
def chunk_file(path: Path, text: str):
    """AST-aware chunking: walk the syntax tree, emit coherent units up to
    MAX_CHARS, recursing into anything too big (a long function) and packing
    small siblings (imports, one-line helpers) together. tree-sitter reports
    byte offsets, so we slice the UTF-8 buffer, not the str."""
    grammar = LANGS.get(path.suffix)
    if grammar is None:
        yield from chunk_lines(path, text)
        return
    data = text.encode("utf-8")
    root = get_parser(grammar).parse(text).root_node()
    line_of = lambda b: data.count(b"\n", 0, b) + 1
    children = lambda n: (n.child(i) for i in range(n.child_count()))
    pending: list[tuple[int, int]] = []  # (start_byte, end_byte) of packed siblings

    def emit():
        if not pending:
            return None
        a, b = pending[0][0], pending[-1][1]
        chunk = Chunk(path, line_of(a), line_of(b), data[a:b].decode("utf-8", "ignore"))
        pending.clear()
        return chunk

    def visit(node, depth=0):
        for child in children(node):
            size = child.end_byte() - child.start_byte()
            if size > MAX_CHARS and child.child_count() and depth < MAX_DEPTH:
                if (c := emit()):
                    yield c
                yield from visit(child, depth + 1)  # a long function: split it further
            else:
                span = pending[-1][1] - pending[0][0] if pending else 0
                if span + size > MAX_CHARS and (c := emit()):
                    yield c
                pending.append((child.start_byte(), child.end_byte()))

    yield from visit(root)
    if (c := emit()):
        yield c
# #endregion chunk


def chunk_lines(path: Path, text: str):
    """Fallback for files we have no grammar for: fixed windows of lines."""
    lines = text.splitlines(keepends=True)
    step = 40
    for i in range(0, len(lines), step):
        body = "".join(lines[i:i + step])
        if body.strip():
            yield Chunk(path, i + 1, i + len(lines[i:i + step]), body)


def walk(root: Path):
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if not path.is_file() or path.stat().st_size > 1 << 20:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if "\0" in text[:8192]:
            continue
        yield path, text


def build(root: Path):
    CACHE.mkdir(parents=True, exist_ok=True)
    print(f"chunking {root} ...")
    t0 = time.time()
    chunks, n_files = [], 0
    for path, text in walk(root):
        n_files += 1
        try:
            chunks.extend(list(chunk_file(path, text)))
        except RecursionError:
            chunks.extend(chunk_lines(path, text))  # pathological AST depth
    print(f"  {n_files} files -> {len(chunks)} chunks in {time.time() - t0:.1f}s")

    print(f"embedding with {MODEL} on GPU ...")
    t0 = time.time()
    # #region index
    model = SentenceTransformer(MODEL, device="cuda", model_kwargs={"torch_dtype": "float16"})
    model.max_seq_length = 512   # a chunk is ~400 tokens; bounds GPU memory
    vecs = model.encode(
        [c.text for c in chunks],
        prompt_name=DOC_PROMPT,      # tag every chunk as a candidate code snippet
        batch_size=64,
        normalize_embeddings=True,   # cosine via inner product
        show_progress_bar=True,
        convert_to_numpy=True,
    ).astype(np.float32)
    print(f"  {len(vecs)} vectors in {time.time() - t0:.1f}s")

    print("building HNSW index ...")
    t0 = time.time()
    index = faiss.IndexHNSWFlat(DIM, 32, faiss.METRIC_INNER_PRODUCT)  # M = 32
    index.hnsw.efConstruction = 200
    index.add(vecs)
    # #endregion index
    print(f"  built in {time.time() - t0:.1f}s")

    faiss.write_index(index, str(CACHE / "index.faiss"))
    with open(CACHE / "chunks.tsv", "w") as f:
        for c in chunks:
            rel = c.path.relative_to(root)
            f.write(f"{rel}\t{c.start}\t{c.end}\n")
    size = (CACHE / "index.faiss").stat().st_size
    print(f"index {size / 1e6:.0f} MB -> {CACHE / 'index.faiss'}")


# #region search
def search(query: str, k: int = 8):
    index = faiss.read_index(str(CACHE / "index.faiss"))
    index.hnsw.efSearch = 64
    meta = [l.rstrip("\n").split("\t") for l in open(CACHE / "chunks.tsv")]
    model = SentenceTransformer(MODEL, device="cuda", model_kwargs={"torch_dtype": "float16"})

    t0 = time.time()
    q = model.encode(
        [query], prompt_name=QUERY_PROMPT, normalize_embeddings=True, convert_to_numpy=True
    ).astype(np.float32)
    scores, ids = index.search(q, k)
    dt = (time.time() - t0) * 1e3

    for score, i in zip(scores[0], ids[0]):
        path, start, end = meta[i]
        print(f"{score:.3f}  {path}:{start}-{end}")
    print(f"\nquery in {dt:.1f}ms (embed + HNSW search)")
# #endregion search


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "index":
        build(Path(sys.argv[2]).resolve())
    elif len(sys.argv) >= 3 and sys.argv[1] == "search":
        search(sys.argv[2])
    else:
        print(__doc__)
        sys.exit(2)
