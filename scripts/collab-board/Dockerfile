# Multi-stage build for the collab-board server (scripts/collab-board).
# A SEPARATE container from the static site: it runs its own axum process on
# 127.0.0.1:8091 behind Caddy at board.filipkunc.com (see ansible/files/Caddyfile).
#
# Build:
#   podman build -t collab-board:latest scripts/collab-board
# Run (matches the Quadlet in ansible/files/collab-board.container):
#   podman run --rm -p 127.0.0.1:8091:8091 -e ADDR=0.0.0.0:8091 collab-board:latest

ARG RUST_VERSION=1.96

# --- build stage -------------------------------------------------------------
FROM rust:${RUST_VERSION}-slim-bookworm AS build
WORKDIR /build
# Cache deps separately from source so a one-line change doesn't rebuild the
# whole dependency graph.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release || true
COPY src ./src
COPY ws.html sse.html ./
# Touch main.rs so cargo sees the real source, not the stub.
RUN touch src/main.rs && cargo build --release

# --- runtime stage -----------------------------------------------------------
FROM debian:bookworm-slim AS runtime
# tini reaps zombie children if tokio ever leaks a task; small and harmless.
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /build/target/release/collab-board /usr/local/bin/collab-board

ENV ADDR=0.0.0.0:8091
EXPOSE 8091
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["collab-board"]
