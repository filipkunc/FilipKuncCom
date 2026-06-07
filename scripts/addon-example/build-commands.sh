#!/usr/bin/env bash
# Per-target build commands (reference; build-all.sh runs them with the right cwd).

# #region cpp
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
# #endregion cpp

# #region rust
# this machine
napi build --release

# or every platform from one Linux runner (cargo-zigbuild + cargo-xwin under the hood)
napi build --release --target aarch64-apple-darwin       --use-napi-cross  # macOS arm64
napi build --release --target x86_64-apple-darwin        --use-napi-cross  # macOS x64
napi build --release --target aarch64-unknown-linux-gnu  --use-napi-cross  # Linux arm64
napi build --release --target x86_64-unknown-linux-musl  --use-napi-cross  # Alpine / musl
napi build --release --target aarch64-pc-windows-msvc                      # Windows arm64
napi build --release --target x86_64-pc-windows-msvc                       # Windows x64
# #endregion rust

# #region wasm-c
emcc -O3 -DMINIZ_NO_ZLIB_COMPATIBLE_NAMES -DMINIZ_NO_STDIO -Ivendor \
  wasm/wasm_binding.c vendor/miniz.c -o fast_deflate.wasm \
  -sSTANDALONE_WASM -Wl,--no-entry \
  -sEXPORTED_FUNCTIONS=_compress,_decompress,_malloc,_free -sINITIAL_MEMORY=67108864
# #endregion wasm-c

# #region wasm-rust
# the same crate compiled to wasm via emnapi, one target away
rustup target add wasm32-wasip1-threads
napi build --release --target wasm32-wasip1-threads
# #endregion wasm-rust
