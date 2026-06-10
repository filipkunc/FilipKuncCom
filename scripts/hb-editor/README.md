# hb-editor

Workspace for the text-rendering post: a minimal web text editor rendering
through HarfBuzz 14's hb-gpu (Slug-algorithm GPU text), WebGL2 first.

## Layout

- `build-wasm.sh` — fetches HarfBuzz 14.2.1 sources (into `~/.cache/hb-src`)
  and the fonts (OFL, into `fonts/`), compiles HarfBuzz core + the hb-gpu
  sources + `src/shim.c` with Emscripten into `dist/hb-gpu.mjs` +
  `dist/hb-gpu.wasm` (~620 KB raw, ~180 KB brotli), and generates web font
  subsets (`fonts/*-subset.ttf`, default instance + Latin/Latin-1/Ext-A,
  ~2 MB -> ~330 KB) via uvx fonttools. Demos ship the subsets; node tests
  keep the full fonts.
- `src/shim.c` — C shim: create font, shape UTF-8, encode glyph texels,
  fetch shader sources. Flat buffers only across the wasm boundary.
- `src/hb.mjs` — JS wrapper exposing `loadHb()`, `HbFont.shape()`,
  `HbFont.encodeGlyph()`, `shaderSource(which, stage, lang)`.
- `test/smoke.test.mjs` — node:test suite covering shaping, encoding,
  extents conventions, and shader source retrieval.

## Build and test

```sh
./scripts/hb-editor/build-wasm.sh        # needs ~/emsdk
npm run test:hb                          # wasm shaping/encoding smoke tests
npx playwright test e2e/hb-editor*.ts    # rendering + editor + compare tests
node scripts/hb-editor/serve.mjs         # playground/editor/compare on :4787
node scripts/hb-editor/trace.mjs         # Perfetto trace of both pipelines
```

## Performance measurement (honest picture)

- In-page CPU numbers (compare page status line) are SUBMIT cost only; GL
  commands and Skia display lists are queued, GPU execution happens later.
- Measured phase split (Ryzen, 48 glyphs x 5 sizes): wasm shaping 11 us,
  JS object building 5 us, setRuns quads+bufferData 84 us, GL submit 3 us.
  JS->wasm call boundary is 30 ns/call — not a bottleneck.
- GPU side of OUR draws: EXT_disjoint_timer_query_webgl2 when available
  (src/gputimer.mjs; SwiftShader lacks it). Canvas 2D GPU work is invisible
  to JS by design.
- Both pipelines together: `node scripts/hb-editor/trace.mjs` captures a
  Chrome trace (open in ui.perfetto.dev). Canvas raster shows up as
  RasterDecoderImpl::DoRasterCHROMIUM / RendererRasterWorker in the GPU
  process; our draws as WebGL events. Default is headless SwiftShader
  (plumbing check); pass `--hw` for a headed run on the real GPU — those are
  the numbers worth publishing.
- Attribution caveat: DOM tile raster and canvas 2D share the RasterDecoder
  path and are indistinguishable in a combined trace. Use `--panes hb`,
  `--panes c2d`, `--panes dom` (compare page honors `?panes=`) to trace one
  pipeline at a time. trace.mjs hides the page UI during capture — status
  line rewrites otherwise re-raster every frame and pollute the baseline.
- Measured at editor scale (48 glyphs x 5 sizes, hw GPU, 2026-06-10): every
  pipeline is < 0.2 ms/frame of GPU-process work (ours ~0.17, canvas raster
  delta ~0.04, DOM raster delta ~0.07) vs ~0.35 ms shared compositor. At
  this scale all three are noise; differences need the zoom benchmark.
- web/bench/ is the zoom benchmark: text size animates every frame
  (11-72px sine), so atlas pipelines re-rasterize every glyph at every new
  size while hb-gpu reuses encoded curves. Pipelines run sequentially;
  metric = delivered frame intervals (avg/p95/p99/worst + % over 1.5x the
  measured refresh budget). "per-row phase" gives every row a distinct size
  per frame (N x atlas churn). The load slider adds REAL rows first (denser
  line height down to ~13px), then stacks phase-shifted copies (load 24 ~=
  14k glyphs/frame). "quantize sizes" snaps to whole px: continuous float
  sizes defeat Skia's strike cache by construction (new strike every frame),
  quantized sizes recur each cycle so the browser glyph cache works — run
  BOTH modes, they answer different questions (free pinch-zoom vs stepped
  zoom). hb-gpu's cost is identical in both (no size-keyed cache to miss).
  ?quick=1 shortens phases for e2e. Filip's 240Hz baseline (load 1,
  552 glyphs): all three pipelines hold 240fps; DOM alone shows first jank
  (worst 8.3ms). OffscreenCanvas note: it moves command recording to a
  worker (thread isolation), raster/GPU cost is unchanged — irrelevant for
  these isolated throughput runs, relevant for editor-under-load latency.
  CAVEAT: on SwiftShader the result INVERTS (hb-gpu 55.8 vs canvas 60 fps —
  software fragment shading is our worst case, Skia CPU raster is the
  browser's best path). Only hardware-GPU numbers are quotable. Compositor work (DrawAndSwap/SwapBuffers/
  Graphics.Pipeline) is shared overhead, attributable to neither. The
  GPU-process "WebGL" slice is command decode on the GPU-process CPU thread,
  NOT shader time on silicon — silicon time comes from the in-page
  timer query.
- serve.mjs sends COOP/COEP, so pages are crossOriginIsolated and
  performance.now() resolves at ~5us instead of ~100us (status line shows
  which). The headline benchmark for the post should still be a
  MotionMark-style ramp (max glyphs at 60fps) plus the zoom-animation
  scenario where atlas re-rasterization makes canvas lose.

## Conventions worth remembering

- hb-gpu encodes in font units (encoder scale = font scale = upem); the blob
  format quantizes to ±8000 with 0.25-unit steps, so font units are correct
  and normalized 0..1 coordinates are not.
- `hb_glyph_extents_t`: `yBearing` is the glyph top (Y-up), `height` is
  negative (extends down). Ink-less glyphs (space) encode to a zero-length
  blob, surfaced as `null` from `encodeGlyph()`.
- Texels are RGBA16I, 8 bytes each. WebGL2 lacks texture buffers, so the
  renderer must use the `HB_GPU_ATLAS_2D` path (isampler2D + width uniform).

## Renderer conventions (mirrors HarfBuzz's util/gpu reference demo)

- Texcoords are font units (y-up); positions are pixels (y-down). The blob
  header stores upem as the scale, so `hb_gpu_ppem()` is consistent with
  font-unit texcoords.
- Per-vertex `a_emPerPos` = upem / fontSizePx feeds the dilation Jacobian
  `(emPerPos, 0, 0, -emPerPos)`; corner normals are screen-space diagonals;
  `u_viewport` is the full canvas size in pixels.
- Fragment output is premultiplied alpha; blend is (ONE, ONE_MINUS_SRC_ALPHA).
  Stem darkening and gamma adjust edge coverage only (cov in (0,1)), exactly
  like the reference demo-fragment.glsl.
- The tarball's `util/gpu/` contains the full reference implementation
  (demo-vertex.glsl, demo-fragment.glsl, demo-shader.h quad construction);
  consult it before inventing anything.

## Ligature caret/selection policy (the DirectWrite problem, solved)

Caret stops are GRAPHEME boundaries (Intl.Segmenter), not shaping clusters:

- combining marks: one grapheme = one caret step (correct);
- ligatures (fi/ffi in EB Garamond): caret stops INSIDE the ligature glyph,
  x from GDEF ligature carets when the font has them, else even division of
  the cluster advance (same fallback Chromium/Blink uses);
- partial-ligature selection: highlight rects use the same interpolated x,
  and selected text is redrawn white under a scissor rect, so one ligature
  glyph renders two-tone across the selection edge. DirectWrite-based
  editors can't do this (see SO 48462119); we can because we own all layers.

Font notes: Inter has NO f-ligatures by design. EB Garamond ligates fi/ffi
(no GDEF carets, so even division kicks in). Fira Code implements programming
ligatures per-character (clusters never merge), i.e. caret-safe by design.
Calibri ligates but is proprietary, so it can't be bundled.

## Milestones

1. DONE — wasm build + shaping/encoding smoke tests.
2. DONE — WebGL2 renderer (src/renderer.mjs) + interactive playground (web/)
   + 6 Playwright pixel tests (e2e/hb-editor.spec.ts).
3. DONE — editor core: doc.mjs (text/cursor/selection/layout, 30 node tests),
   editor.mjs (hidden-textarea input, mouse, clipboard, caret blink, font
   switching), web/editor/ page, 7 Playwright tests
   (e2e/hb-editor-edit.spec.ts) including two-tone partial-ligature selection.
4. DONE (calibrated) — quality: web/compare/ renders the same text + font
   file through hb-gpu, canvas 2D fillText (opaque), and DOM at 12-36px with
   stem-darkening/gamma controls (3 Playwright tests,
   e2e/hb-editor-compare.spec.ts). Empirical result (Samsung OLED G80SD,
   4K @ 145% scaling, grayscale AA): edge-coverage gamma 0.7-0.8 makes
   hb-gpu visually match DOM at small sizes; 0.75 is now the default
   everywhere (COVERAGE_GAMMA in editor.mjs, slider defaults). This is the
   counterpart of Skia's gamma/contrast-boosted glyph masks; raw linear
   coverage reads thinner. A 1x-display check would still be a nice data
   point for the post. Scrolling and IME composition preview are known gaps.
