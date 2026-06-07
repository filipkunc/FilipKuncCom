#!/usr/bin/env bash
# Build and test every binding. Reproducible setup for the native-node-addons post.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> npm deps";            npm install --silent

echo "==> C++ (Node-API) + GoogleTest"
npm run build:cpp
npm run test:cpp

echo "==> NaN (node-gyp)"
( cd nan && npx --yes node-gyp configure build )

echo "==> Rust (napi.rs) + cargo test"
( cd rust && npm install --silent && cargo test && npx --yes napi build --release --platform )

echo "==> C -> WebAssembly (emcc)"
emcc -O3 -DMINIZ_NO_ZLIB_COMPATIBLE_NAMES -DMINIZ_NO_STDIO -Ivendor \
  wasm/wasm_binding.c vendor/miniz.c -o wasm/fast_deflate.wasm \
  -sSTANDALONE_WASM -Wl,--no-entry \
  -sEXPORTED_FUNCTIONS=_compress,_decompress,_malloc,_free -sINITIAL_MEMORY=67108864

echo "==> TypeScript end-to-end (ava)"
npm run test:ts

echo "All bindings built and tested."
