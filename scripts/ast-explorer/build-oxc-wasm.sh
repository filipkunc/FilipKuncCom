#!/usr/bin/env bash
# Build the oxc transform crate in this directory to wasm and drop the artifact
# in dist/. Run this when src/lib.rs changes. Needs Rust nightly (oxc uses
# if-let guards) and the wasm32-unknown-unknown target:
#   rustup toolchain install nightly
#   rustup target add wasm32-unknown-unknown --toolchain nightly
#
# dist/oxc_wasm_web.wasm is committed (the cargo target/ is not) so the container
# build needs no Rust toolchain, the same way scripts/flowfield works.
set -euo pipefail

cd "$(dirname "$0")"
cargo +nightly build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/oxc_wasm_web.wasm dist/oxc_wasm_web.wasm
echo "built dist/oxc_wasm_web.wasm ($(wc -c < dist/oxc_wasm_web.wasm) bytes)"
