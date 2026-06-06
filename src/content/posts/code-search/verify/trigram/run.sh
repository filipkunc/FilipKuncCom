#!/bin/sh
# Build the toy indexer and show the trigram query each regex compiles to.
# CARGO_TARGET_DIR is set by the verifier; the deploy image never runs this.
set -e
cd "$(dirname "$0")"
cargo build --release --quiet --manifest-path ../../trigram/Cargo.toml
BIN="${CARGO_TARGET_DIR:-../../trigram/target}/release/trigram"

for re in 'hello' 'Google.*Search' '(Path|PathFragment).*=' 'napi_create_[a-z]+' 'ab'; do
  printf '%-26s  ->  %s\n' "$re" "$("$BIN" explain "$re")"
done
