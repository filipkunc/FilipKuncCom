# addon-example

A small but real native addon, wrapping the [miniz](https://github.com/richgel999/miniz)
deflate compressor and exposing it to Node four ways. This is the worked example for the
`native-node-addons` post, and it is meant to be reproduced: clone, build, run the tests.

```bash
bash build-all.sh      # build + test all four bindings
```

## What it builds

| Binding   | Native code                | Build            | Tests          |
|-----------|----------------------------|------------------|----------------|
| Node-API  | `cpp/` (wraps miniz)       | pure CMake       | GoogleTest     |
| NaN       | `nan/` (wraps miniz)       | node-gyp         | (via ava)      |
| napi.rs   | `rust/` (flate2/miniz_oxide) | `napi build`   | `cargo test`   |
| wasm      | `wasm/` (miniz via emcc)   | emcc standalone  | (via ava)      |

The pure compression logic lives in `cpp/deflate.cpp` and `rust/src/lib.rs` so it can be
unit-tested without Node; each binding is a thin wrapper that marshals Buffers, runs the
work off the event loop, and owns the streaming handle's native state.

## Per-step commands

```bash
npm run build:cpp && npm run test:cpp   # Node-API addon + GoogleTest
cd rust && cargo test && npx napi build --release --platform   # napi.rs + cargo test
npm run test:ts                          # ava: roundtrip every addon, check zlib interop
```

## Requirements

Node 24, a C/C++ toolchain, CMake, node-gyp (Python 3) for the NaN build, a stable Rust
toolchain with `@napi-rs/cli`, and emscripten (`emcc`) for the wasm build. miniz is vendored
in `vendor/` (the one file the C and wasm builds compile); everything else is an npm or cargo
dependency.
