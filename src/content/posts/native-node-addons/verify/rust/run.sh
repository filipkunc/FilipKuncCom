#!/bin/sh
# cargo test on the Rust core. Uses the workspace target (built), not the cache.
set -e
unset CARGO_TARGET_DIR
cd "$(dirname "$0")/../../../../../../scripts/addon-example/rust"
cargo test 2>/dev/null
