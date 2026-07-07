# Corrosion tutorial: Rust (oxc) → C++ (NaN) → Node.js, one CMake build

A minimal but real project showing how Corrosion makes a Rust crate a
first-class citizen of a C++ CMake build. The Rust crate wraps
[oxc](https://oxc.rs) (parser + codegen), a C++ NaN addon exposes it to
Node.js, and plain `cmake` builds everything. No node-gyp, no cmake-js.

```
 node demo.js
   │  require('./build/addon.node')
   ▼
 addon.cpp (C++, NaN)          ── V8 strings in, JSON string out
   │  extern "C" oxc_analyze()
   ▼
 liboxc_bridge.a (Rust)        ── built by cargo, linked by CMake
   │
   ▼
 oxc_parser / oxc_codegen      ── the actual work
```

CMake compiles `addon.cpp` against the headers that ship inside the Node
installation and, through Corrosion, runs `cargo build` for the crate. The
linker then joins both worlds into `addon.node`.

## Layout

```
CMakeLists.txt        the interesting file: Corrosion + the addon target
rust/
  Cargo.toml          crate-type = ["staticlib"]
  src/lib.rs          C ABI over oxc: oxc_analyze / oxc_free_string
src/
  addon.cpp           NaN glue, deliberately thin
.vscode/
  launch.json         VS Code debug configs incl. the three-layer compound
debug/
  session.gdb         the same session scripted for terminal gdb
index.js              JSON.parse wrapper around the addon
demo.js               parses TS, broken JS, and round-trips formatting
```

## Build and run

```sh
npm install                     # only fetches nan (header-only)
npm run build                   # cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build
node demo.js
```

## The three layers, bottom up

### 1. Rust: a staticlib with a C ABI (`rust/`)

`crate-type = ["staticlib"]` in `Cargo.toml` makes cargo emit a plain
`liboxc_bridge.a` that any C/C++ linker understands. That is the entire
integration trick on the Rust side.

`src/lib.rs` exports exactly two `extern "C"` functions and keeps the
boundary dumb: UTF-8 strings in, one JSON string out. Three rules worth
internalizing there, because they apply to every Rust/C++ boundary:

- **Ownership is explicit.** `oxc_analyze` returns a string allocated by
  Rust, and the caller must return it via `oxc_free_string`. C++ calling
  `free()` on it would pair two different allocators, which is undefined
  behavior that usually works right up until it doesn't.
- **Panics must not cross the ABI.** Unwinding through a C frame is UB, so
  the export wraps everything in `catch_unwind` and degrades to an error
  JSON.
- **Keep the surface serial-friendly.** Passing JSON instead of structs
  means no `#[repr(C)]` layout contracts to keep in sync. For a hot path
  you'd graduate to real structs or [cxx](https://cxx.rs), but start dumb.

### 2. CMake + Corrosion (`CMakeLists.txt`)

The whole integration is three lines:

```cmake
FetchContent_Declare(Corrosion GIT_REPOSITORY ... GIT_TAG v0.6.1)
FetchContent_MakeAvailable(Corrosion)
corrosion_import_crate(MANIFEST_PATH rust/Cargo.toml)
```

`corrosion_import_crate` reads the manifest and creates a CMake target named
after the crate (`oxc_bridge`). After that, the payoff line reads like any
other CMake dependency:

```cmake
target_link_libraries(addon PRIVATE oxc_bridge)
```

What Corrosion is doing for you behind that target:

- **Build-time cargo invocation.** The target runs `cargo build` on every
  build and lets cargo's own incremental tracking decide what to do. Edit
  `lib.rs` and rebuild: cargo recompiles the crate and CMake relinks the
  addon. Touch nothing and the whole build is a sub-second no-op. This is
  the part an `ExternalProject` stamp file gets wrong.
- **Profile mapping.** `CMAKE_BUILD_TYPE=Release` becomes
  `cargo build --release`, `Debug` becomes the dev profile with full debug
  info. With a multi-config generator (Visual Studio, Xcode) this mapping
  happens per-config via generator expressions.
- **Out-of-source cargo output.** Corrosion points `CARGO_TARGET_DIR` into
  the CMake build tree, so artifacts land in `build/cargo/.../release/` and
  the final staticlib is copied to `build/liboxc_bridge.a`. `rm -rf build`
  cleans both worlds. A plain `cargo build` run by hand inside `rust/`
  still uses `rust/target/` and is invisible to the CMake build.
- **Native link dependencies.** A Rust staticlib needs platform extras
  (`pthread`, `dl`, `m` on Linux, `ws2_32`/`bcrypt`/`userenv` on Windows).
  Corrosion asks rustc for the real list (`--print native-static-libs`) and
  attaches it to the target as usage requirements, so you never maintain it.
- **Cross-compilation.** Set a CMake toolchain and Corrosion derives the
  matching Rust `--target` triple. Not used here, but it's why this scales
  past a laptop.

Proof it's really cargo under CMake: `touch rust/src/lib.rs && npm run build`
(cargo recompiles, CMake relinks). Then inspect `build/liboxc_bridge.a` and
`build/cargo/`.

### 3. C++ + NaN (`src/addon.cpp`), without node-gyp or cmake-js

A Node addon is just a shared library renamed to `.node`:

```cmake
add_library(addon SHARED src/addon.cpp)
set_target_properties(addon PROPERTIES PREFIX "" SUFFIX ".node")
```

The usual reason for node-gyp/cmake-js is locating Node's headers and link
flags. But an nvm or tarball install of Node ships its own headers, so
CMake can just ask node where it lives (same move as the Node-API variant
in `scripts/addon-example`, which resolves headers from the
`node-api-headers` npm package):

```cmake
execute_process(COMMAND node -p
  "require('path').join(require('path').dirname(process.execPath), '..', 'include', 'node')"
  OUTPUT_VARIABLE NODE_INC ...)
```

NaN needs the full `node.h`/`v8.h` (it predates the stable Node-API), which
is why the headers come from the Node install rather than an npm package.
Linking needs nothing at all on Linux: the addon's Node/V8 symbols stay
undefined and resolve when node `dlopen()`s it. macOS needs
`-undefined dynamic_lookup`. Windows is the one platform where a tool
earns its keep, because the addon must link against `node.lib`.

NaN is the old, V8-facing addon API, used here because it makes the glue
visible. For new production code prefer Node-API (`node-addon-api`), which
is ABI-stable across Node versions. Nothing about the Corrosion side would
change: swap `addon.cpp` and the include path, keep the Rust target.

## Debugging all three layers at once

Both routes below use the Debug configuration in `build-debug/` (C++ with
`-g`, cargo dev profile with full debug info, mapped by Corrosion from
`CMAKE_BUILD_TYPE=Debug`). `index.js` loads it when `OXC_NAN_DEBUG=1`.

### In VS Code (`.vscode/launch.json`)

Open this folder (not the repo root) in VS Code. The native configs use
CodeLLDB (`vadimcn.vscode-lldb`, recommended by `.vscode/extensions.json`).
Note there is no extension literally called "cppdbg": that is the debug
adapter type inside Microsoft's C/C++ extension (`ms-vscode.cpptools`).
CodeLLDB is the better fit here anyway: it bundles its own lldb, doesn't
fight a clangd setup, and its formatters understand Rust types natively.
Two ways in:

**"Native: lldb on node demo.js"** is the one-click version: it runs the
`build:debug` task, launches node under lldb, and breakpoints set in
`src/addon.cpp` *and* `rust/src/lib.rs` just work. Rust needs no special
debugger support here, cargo emits ordinary DWARF.

Both native configs set `"sourceLanguages": ["cpp", "rust"]`. That line is
load-bearing: it switches on CodeLLDB's language-aware formatters, so a
`String` or `&str` hover shows the text and a `Vec` shows its elements.
Without it you get the raw memory layout (`buf`, `inner`, `_marker`,
`RawVec` internals), which is technically the truth and practically
useless.

**"All three layers (JS + native)"** is the compound config and the reason
VS Code beats terminal gdb for this: JS breakpoints in `demo.js` and native
breakpoints in C++/Rust hit in the same window, from one keypress, with no
prompts. The trick is launching in the *native-first* direction, because a
port is deterministic and a pid is not:

1. lldb launches `node --inspect-brk=9229 demo.js` (a hidden helper
   config). Native breakpoints are registered before node even starts;
   node then parks itself waiting on the inspector port, before the addon
   is `require()`d.
2. The JS debugger attaches to port 9229 (the other hidden helper) and
   auto-resumes. The earlier version of this compound went the other way
   around, JS launch + lldb attach-by-pid, and paid for it with a process
   picker on every run.
3. Native breakpoints stay pending until `require()` dlopens the addon,
   then bind. From here both debuggers take turns: step over
   `analyze(...)` in demo.js, land in `AnalyzeJson`, step into
   `oxc_bridge::analyze`.

Both call stacks show side by side in the panel, one per debug session:
the JS one with demo.js frames, the native one with the
C++/Rust/`catch_unwind` stack from the next section.

One thing to adjust per machine: the launch configs need an absolute
`program` path, so `launch.json` pins the nvm node binary (`command -v
node` tells you yours).

### Seeing into V8 (hover on a Local, `v8obj`, `v8bt`)

Rust values render once `sourceLanguages` is on, but V8 handles are a
harder problem: a `v8::Local` is a pointer to a slot holding a tagged
pointer into V8's heap, and the object behind it has no DWARF description.
Out of the box, hovering a `v8::Local<v8::String>` shows `location_` and
nothing else.

`debug/v8_formatters.py` fixes the hover. It's an lldb summary provider
(loaded by `initCommands`) that decodes V8 objects from raw memory, so
hovering `result` in `AnalyzeJson` shows the JSON text, and Smis,
HeapNumbers, `undefined`/`null`/`true`/`false` all render as themselves.
The interesting part is how it stays correct across V8 versions without
hardcoding offsets: node ships ~480 `v8dbg_*` postmortem constants (int32
globals describing field offsets, tag masks, and instance types for the
exact V8 compiled in), and the formatter reads them from the debuggee at
debug time, then walks handle slot → tagged pointer → map →
`instance_type` → the right string representation (sequential, cons, thin,
sliced, one- or two-byte). This is a miniature of how
[llnode](https://github.com/nodejs/llnode) works, in ~200 lines you can
read. It assumes official node builds (64-bit, no pointer compression).

For everything the formatter doesn't cover, node also compiles in V8's own
debug print helpers, and both debug setups define two commands on them:

- `v8obj <a v8::Local variable>` prints the JS value behind the handle
  (`v8obj result` in `AnalyzeJson` prints the whole JSON string).
- `v8bt` prints the JS stack as V8 sees it, with real file:line info:
  `analyze (index.js:9)`, the caller in `demo.js`, down through node's
  module loader. This is the readable version of the anonymous JIT frames
  in the native backtrace.

In VS Code, type them into the Debug Console while stopped at a native
breakpoint (CodeLLDB's console accepts lldb commands directly). The
output appears in the terminal alongside node's stdout, not in the
console, because the helpers print from inside the debuggee. The same
commands exist in the gdb session (`debug/session.gdb` defines them) and
`npm run debug` / `npm run debug:dap` both demonstrate `v8bt` at the C++
stop. They're wired up in `initCommands` in `launch.json`; the underlying
calls are `_v8_internal_Print_Object` and `_v8_internal_Print_StackTrace`,
the same functions V8's own `tools/gdbinit` uses.

The recorded session (`npm run debug:dap`) captures the formatter too: its
third stop is on the `info.GetReturnValue().Set(result)` line, where the
Variables panel shows `result: v8::Local<v8::String> = "{"code":...`. Same
stop also shows `json: char *` as garbage. That one is correct, not a bug:
`Nan::New` copied the text into V8's heap and `oxc_free_string` ran on the
previous line, so the panel is faithfully rendering a dangling pointer.

### The VS Code session, recorded (`npm run debug:dap`)

The VS Code flow itself is replayable without the GUI:
`debug/replay-dap.js` connects to the actual CodeLLDB adapter binary from
the installed extension, speaks the Debug Adapter Protocol with the same
configuration as `launch.json`, and prints what VS Code would render: the
stack at each breakpoint and the Variables panel at the Rust frame
(`source: &str = "interface Point..."`, courtesy of `sourceLanguages`).
Useful as a regression check that the debug setup still works after
changing the build, and as documentation of the exact DAP handshake:
initialize → launch → setFunctionBreakpoints → configurationDone →
stopped/stackTrace/scopes/variables → continue.

### Scripted, no GUI (`npm run debug`)

```sh
npm run debug
```

runs `demo.js` under terminal gdb with the scripted session in
`debug/session.gdb`, the same session the VS Code configs give you
interactively. What it demonstrates:

**Breakpoints in a dlopen()ed library.** The addon loads long after gdb
starts, so `set breakpoint pending on` lets `break AnalyzeJson` (C++) and
`break oxc_bridge::analyze` (Rust) wait until `require()` brings the
symbols in.

**The JS → C++ crossing.** First stop, `backtrace` shows who called the
NaN method:

```
#0  AnalyzeJson (info=...) at src/addon.cpp:16
#1  Nan::imp::FunctionCallbackWrapper (info=...) at nan_callbacks_12_inl.h:229
#2  0x00007fffd7dcf08d in ?? ()          <- V8 JIT-compiled code
```

The `??` frames are demo.js, JIT-compiled by V8. Native debuggers can't
symbolize them. That's normal, not broken. Source-level JS frames only
exist in the inspector, which is exactly what the VS Code compound config
adds on top of this.

**One stack, three worlds.** Second stop, in Rust:

```
#0  oxc_bridge::analyze (source=..., filename=...) at src/lib.rs:17
#1  oxc_bridge::oxc_analyze::{closure#0} () at src/lib.rs:74
#4  std::panicking::catch_unwind<...>    <- the panic barrier, visible!
#6  oxc_bridge::oxc_analyze (source=..., filename=...) at src/lib.rs:71
#7  AnalyzeJson (info=...) at src/addon.cpp:30
#8  Nan::imp::FunctionCallbackWrapper (info=...)
#9  0x00007fffd7dcf08d in ?? ()          <- V8 again
```

Read it bottom-up: V8 dispatches JS into NaN (#9→#8), the C++ method calls
the C ABI (#7→#6), `catch_unwind` guards the boundary (#4, the safety rule
from layer 1 showing up in a live stack), and the real Rust code runs on
top (#0).

**Rust values print properly.** gdb has first-class Rust support, so
`info args` at the Rust frame shows `source` and `filename` as actual
strings, not fat-pointer structs:

```
source = "interface Point { x: number; y: number }\n   const origin..."
filename = "point.ts"
```

From here an interactive session is the same commands without the script:
`OXC_NAN_DEBUG=1 gdb --args node demo.js`, then `break`, `run`, `next`,
`step`. Stepping with `step` walks from `addon.cpp` straight into
`lib.rs` source lines.

## Exercises

1. **Extend the ABI end to end.** Add `oxc_minify` to `lib.rs` (see
   `oxc_minifier` or `Codegen` options), declare it in the `extern "C"`
   block in `addon.cpp`, expose it in `Init`, wrap it in `index.js`.
   One rebuild, no build-system changes. That's the point.
2. **Watch the link line.** `cmake --build build -v` shows
   `liboxc_bridge.a` plus the native libs Corrosion added.
3. **Step across the boundary.** In an interactive gdb session, `break
   AnalyzeJson`, then `step` your way from C++ into `oxc_analyze` in
   `lib.rs`. No special setup, it's all just DWARF.
4. **Break the ownership rule.** Change `oxc_free_string(json)` in
   `addon.cpp` to `free(json)` and run the demo under
   `valgrind node demo.js`. Undo it after.

## Gotchas hit while writing this

- oxc moves fast and renames things (`ParserReturn::errors` is now
  `diagnostics`). Pin versions in `Cargo.toml` and keep `Cargo.lock`.
- First cargo build of oxc takes a minute and the resulting `.a` is large
  because it bundles libstd. The linker strips unused code; `addon.node`
  here comes out around 3 MB.
- Distro-packaged Node may not ship `include/node` (Fedora puts it in
  `nodejs-devel`). nvm and the official tarballs always have it, and the
  CMakeLists fails with a clear message if it's missing.
- `index.js` loads `build/addon.node` (Release) by default and
  `build-debug/addon.node` when `OXC_NAN_DEBUG=1`, so both configurations
  can coexist.
