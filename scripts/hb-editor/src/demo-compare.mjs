// Three-pipeline quality comparison, mountable into any root element.
// Expects in root: #text, #font, #darken, #gamma, #gammaVal, #status,
// #gl, #c2d, #dom — the latter three each inside a .pane wrapper.
import { loadHb } from './hb.mjs';
import { createTextRenderer } from './renderer.mjs';
import { createGpuTimer } from './gputimer.mjs';
import { themeColors, onThemeChange } from './theme.mjs';

const SIZES = [12, 14, 17, 24, 36];
const PAD = 14; // CSS px
const ROW_GAP = 10;

export async function mountCompareDemo(root, { fontUrls }) {
  const ui = {
    text: root.querySelector('#text'),
    font: root.querySelector('#font'),
    darken: root.querySelector('#darken'),
    gamma: root.querySelector('#gamma'),
    gammaVal: root.querySelector('#gammaVal'),
    status: root.querySelector('#status'),
  };
  const glCanvas = root.querySelector('#gl');
  const c2dCanvas = root.querySelector('#c2d');
  const domHost = root.querySelector('#dom');

  // ?panes=hb,c2d,dom (default all). Tracing one pipeline at a time keeps
  // GPU-process raster work attributable: DOM tiles and canvas 2D both go
  // through the same RasterDecoder path and are indistinguishable in traces.
  const PANES = (new URLSearchParams(location.search).get('panes') ?? 'hb,c2d,dom')
    .split(',');
  const SHOW = {
    hb: PANES.includes('hb'),
    c2d: PANES.includes('c2d'),
    dom: PANES.includes('dom'),
  };
  for (const [key, el] of [['hb', glCanvas], ['c2d', c2dCanvas], ['dom', domHost]]) {
    if (!SHOW[key]) el.closest('.pane').style.display = 'none';
  }

  const gl = glCanvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: true,
  });
  // Opaque 2D canvas: lets the browser use its best text AA path.
  const ctx2d = c2dCanvas.getContext('2d', { alpha: false });

  // GPU-side timing for OUR draws only. Canvas 2D's GPU work runs in Chrome's
  // GPU process and is not observable from JS; use the Perfetto trace script
  // (scripts/hb-editor/trace.mjs) to see both pipelines.
  const gpuTimer = createGpuTimer(gl);

  const hb = await loadHb();
  const fonts = new Map(); // name -> {hbFont, family, renderer}

  async function getFont(name) {
    if (!fonts.has(name)) {
      const buf = await (await fetch(fontUrls[name])).arrayBuffer();
      const hbFont = hb.createFont(new Uint8Array(buf));
      const family = `cmp-${name}`;
      const face = new FontFace(family, buf);
      await face.load();
      document.fonts.add(face);
      fonts.set(name, { hbFont, family, renderer: createTextRenderer(gl, hb, hbFont) });
    }
    return fonts.get(name);
  }

  // Row geometry in CSS px, derived from hb metrics so all three panes align.
  function rowLayout(hbFont) {
    const fe = hbFont.fontExtents;
    const upem = hbFont.upem;
    const rows = [];
    let y = PAD;
    for (const size of SIZES) {
      const s = size / upem;
      const ascent = fe.ascender * s;
      const height = (fe.ascender - fe.descender) * s + ROW_GAP;
      rows.push({ size, baseline: y + ascent, top: y, height });
      y += height;
    }
    return { rows, total: y + PAD };
  }

  function sizeCanvas(canvas, cssH, dpr) {
    canvas.style.height = `${cssH}px`;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  let lastRenderer = null;
  let lastTiming = null;

  // CPU numbers are SUBMIT cost only — GL commands and Skia display lists are
  // queued, GPU execution happens later for both pipelines. The GPU number
  // (when the timer-query extension exists) is OUR draw only; canvas 2D GPU
  // time runs in Chrome's GPU process and needs the Perfetto trace script.
  function updateStatus() {
    if (!lastTiming) return;
    const t = lastTiming;
    const gpuPart = gpuTimer.available
      ? gpuTimer.last !== null
        ? ` GPU (hb-gpu draws): ${gpuTimer.last.toFixed(2)} ms.`
        : ' GPU: measuring…'
      : ' GPU timer-query: unavailable in this browser/driver.';
    // crossOriginIsolated (COOP/COEP) raises performance.now() resolution
    // from ~100us to ~5us in Chrome.
    const timerNote = window.crossOriginIsolated ? '~5us timers' : '~100us timers';
    const paneNote = PANES.length < 3 ? ` [panes: ${PANES.join(',')}]` : '';
    ui.status.textContent =
      `${t.glyphs} glyphs x ${SIZES.length} sizes — CPU submit (${timerNote}): ` +
      `hb-gpu ${t.hbMs.toFixed(2)} ms ` +
      `(shape ${t.shapeMs.toFixed(2)} + buffers/GL ${(t.hbMs - t.shapeMs).toFixed(2)}), ` +
      `canvas 2D fillText ${t.c2dMs.toFixed(2)} ms.` +
      gpuPart +
      ` Sizes: ${SIZES.join(', ')}px.` +
      paneNote;
  }

  // Timer-query results land a frame or two later; poll briefly after a draw.
  function pollGpuTimer(framesLeft = 12) {
    if (!gpuTimer.available) return;
    const before = gpuTimer.last;
    gpuTimer.poll();
    if (gpuTimer.last !== before) updateStatus();
    else if (framesLeft > 0) requestAnimationFrame(() => pollGpuTimer(framesLeft - 1));
  }

  async function draw() {
    const theme = themeColors();
    const { hbFont, family, renderer } = await getFont(ui.font.value);
    const text = ui.text.value;
    const dpr = window.devicePixelRatio || 1;
    const { rows, total } = rowLayout(hbFont);

    // All layout reads and canvas sizing happen OUTSIDE the timed regions:
    // clientWidth forces a document re-layout (dirtied by the previous
    // DOM-pane update) and must not be billed to either rendering path.
    sizeCanvas(glCanvas, total, dpr);
    sizeCanvas(c2dCanvas, total, dpr);
    const c2dCssW = c2dCanvas.clientWidth;

    // --- hb-gpu pane: one shape() reused for every size (font units). ---
    const t0 = performance.now();
    let glyphCount = 0;
    let tShape = t0;
    if (SHOW.hb) {
      const shaped = hbFont.shape(text);
      glyphCount = shaped.length;
      tShape = performance.now();
      renderer.setRuns(
        rows.map((r) => ({
          shaped,
          x: PAD * dpr,
          y: r.baseline * dpr,
          sizePx: r.size * dpr,
        })),
      );
      gpuTimer.begin();
      renderer.render({
        stemDarkening: ui.darken.checked,
        gamma: Number(ui.gamma.value),
        foreground: theme.fg,
        background: theme.bg,
      });
      gpuTimer.end();
      gpuTimer.poll();
    }
    const tHb = performance.now();

    // --- canvas 2D pane ---
    if (SHOW.c2d) {
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.fillStyle = theme.css.bg;
      ctx2d.fillRect(0, 0, c2dCssW, total);
      ctx2d.fillStyle = theme.css.fg;
      ctx2d.textBaseline = 'alphabetic';
      for (const r of rows) {
        ctx2d.font = `${r.size}px ${family}`;
        ctx2d.fillText(text, PAD, r.baseline);
      }
    }
    const tC2d = performance.now();

    // --- DOM pane (untimed; dirties layout, which the next draw must not pay) ---
    if (SHOW.dom) {
      domHost.style.height = `${total}px`;
      domHost.replaceChildren(
        ...rows.map((r) => {
          const div = document.createElement('div');
          div.textContent = text;
          div.style.font = `${r.size}px ${family}`;
          div.style.top = `${r.top}px`;
          div.style.left = `${PAD}px`;
          return div;
        }),
      );
    }

    lastTiming = {
      glyphs: glyphCount,
      hbMs: tHb - t0,
      shapeMs: tShape - t0,
      c2dMs: tC2d - tHb,
    };
    updateStatus();
    pollGpuTimer();
    lastRenderer = renderer;
  }

  for (const el of [ui.text, ui.font, ui.darken, ui.gamma]) {
    el.addEventListener('input', () => {
      ui.gammaVal.textContent = Number(ui.gamma.value).toFixed(2);
      draw();
    });
  }
  window.addEventListener('resize', () => draw());
  onThemeChange(() => draw());

  await draw();

  // Hooks for the Playwright spec and the trace script.
  window.__cmp = {
    draw,
    readStats: () => lastRenderer.readStats(),
    read2d: () => {
      const { width: w, height: h } = c2dCanvas;
      const d = ctx2d.getImageData(0, 0, w, h).data;
      let inked = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] < 248) inked++;
      return { inked, total: w * h };
    },
  };
  window.__cmpReady = true;
}
