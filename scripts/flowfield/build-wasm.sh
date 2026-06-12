#!/bin/bash
# Builds the flow field sim to wasm and copies the artifact into dist/, which
# is committed (the deploy image builds from git archive and must not need a
# Rust toolchain). Run after any change under src/.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

cargo build --manifest-path "$DIR/Cargo.toml" --release --target wasm32-unknown-unknown
mkdir -p "$DIR/dist"
cp "$DIR/target/wasm32-unknown-unknown/release/flowfield.wasm" "$DIR/dist/flowfield.wasm"
ls -la "$DIR/dist/flowfield.wasm"
