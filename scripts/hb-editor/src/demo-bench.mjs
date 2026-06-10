// Zoom benchmark, mountable into any root element. Text size animates every
// frame, so atlas-based pipelines (canvas 2D, DOM) must re-rasterize every
// glyph at every new size while hb-gpu reuses the same encoded curve data.
// Pipelines run ONE AT A TIME and the metric is delivered frame intervals
// (rAF deltas) — that reflects what the user sees regardless of where the
// bottleneck is. ?quick=1 shortens phases for the e2e test.
// Expects in root: #run, #phase, #load, #loadVal, #quant, #watch, #live,
// #results, #gl, #c2d, #domHost — canvases and domHost inside a .stage.
import { loadHb } from './hb.mjs';
import { createTextRenderer } from './renderer.mjs';
import { themeColors, onThemeChange } from './theme.mjs';

const MIN_SIZE = 11;
const MAX_SIZE = 72;
const PERIOD_MS = 2400; // one zoom cycle
const PAD = 14;
const SAMPLE_TEXT = 'Sphinx of black quartz, judge my vow. 0O 1Il| ';

export async function mountZoomBench(root, { fontUrl }) {
  const QUICK = new URLSearchParams(location.search).has('quick');
  const WARM_MS = QUICK ? 300 : 1500;
  const SAMPLE_MS = QUICK ? 500 : 4000;

  const ui = {
    run: root.querySelector('#run'),
    phase: root.querySelector('#phase'),
    quant: root.querySelector('#quant'),
    load: root.querySelector('#load'),
    loadVal: root.querySelector('#loadVal'),
    watchRadios: [...root.querySelectorAll('input[name="watch"]')],
    live: root.querySelector('#live'),
    results: root.querySelector('#results'),
    progress: root.querySelector('#progress'),
  };
  const controls = [ui.run, ui.phase, ui.quant, ui.load, ...ui.watchRadios];
  const glCanvas = root.querySelector('#gl');
  const c2dCanvas = root.querySelector('#c2d');
  const domHost = root.querySelector('#domHost');
  const stage = glCanvas.parentElement;

  const gl = glCanvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: true });
  const ctx2d = c2dCanvas.getContext('2d', { alpha: false });

  // Theme cached outside the frame loops (getComputedStyle is not free at 240 Hz).
  let theme = themeColors();
  onThemeChange(() => { theme = themeColors(); });
  const watchValue = () => ui.watchRadios.find((r) => r.checked)?.value ?? 'hb';

  const hb = await loadHb();
  const fontBuf = await (await fetch(fontUrl)).arrayBuffer();
  const font = hb.createFont(new Uint8Array(fontBuf));
  const family = 'bench-Inter';
  const face = new FontFace(family, fontBuf);
  await face.load();
  document.fonts.add(face);
  const renderer = createTextRenderer(gl, hb, font);

  // Scene: fixed row slots; text length fills the width at a mid size, so all
  // pipelines draw the identical glyph set per frame.
  const dpr = window.devicePixelRatio || 1;
  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;
  const BASE_LINE_H = MAX_SIZE * 1.06;
  const BASE_ROWS = Math.floor((stageH - 2 * PAD) / BASE_LINE_H);
  const midSize = Math.sqrt(MIN_SIZE * MAX_SIZE);
  const oneShaped = font.shape(SAMPLE_TEXT);
  const oneWidth = oneShaped.reduce((s, g) => s + g.xAdvance, 0) * (midSize / font.upem);
  const repeats = Math.max(1, Math.ceil((stageW - 2 * PAD) / oneWidth));
  const rowText = SAMPLE_TEXT.repeat(repeats);
  const shaped = font.shape(rowText);
  const glyphsPerFrame = () => shaped.length * ROWS * COPIES;

  for (const c of [glCanvas, c2dCanvas]) {
    c.width = Math.round(stageW * dpr);
    c.height = Math.round(stageH * dpr);
  }

  // Load multiplier: first add REAL rows (denser line height, more visible
  // text), then stack phase-shifted near-overlapping copies once density
  // maxes out. Both cost models scale linearly: canvas/DOM pay rows x copies
  // unique (glyph, size) rasterizations per frame, hb-gpu the same factor in
  // vertex/fragment work.
  let LOAD = 1;
  let ROWS = BASE_ROWS;
  let LINE_H = BASE_LINE_H;
  let COPIES = 1;

  function applyLoad() {
    const want = BASE_ROWS * LOAD;
    const maxRows = Math.floor((stageH - 2 * PAD) / 13); // ~13px min line height
    ROWS = Math.min(want, maxRows);
    LINE_H = (stageH - 2 * PAD) / ROWS;
    COPIES = Math.ceil(want / ROWS);
    buildDomRows();
  }

  // DOM rows rebuilt when LOAD changes; only font-size changes per frame.
  let domRows = [];
  function buildDomRows() {
    domHost.replaceChildren();
    domRows = [];
    for (let k = 0; k < COPIES; k++) {
      for (let i = 0; i < ROWS; i++) {
        const div = document.createElement('div');
        div.textContent = rowText;
        div.style.fontFamily = family;
        div.style.top = `${PAD + i * LINE_H + copyOffset(k)}px`;
        domHost.append(div);
        domRows.push(div);
      }
    }
  }

  function copyOffset(k) {
    return (k % 4) * 2; // few px so copies stay on-stage
  }

  function sizeAt(tMs, row, copy = 0) {
    const phase = (ui.phase.checked ? row * 0.9 : 0) + copy * 0.37;
    const s = 0.5 + 0.5 * Math.sin((tMs / PERIOD_MS) * 2 * Math.PI + phase);
    const size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * s;
    // Continuous float sizes defeat Skia's strike cache by construction (a
    // new strike per frame). Quantized sizes recur every cycle, so the
    // browser's glyph cache gets to do its job — both modes are real-world.
    return ui.quant.checked ? Math.round(size) : size;
  }

  // Honor whatever the markup preselects (the post embeds a heavier default
  // than the standalone page), so the label never lies about the actual load.
  LOAD = Number(ui.load.value) || 1;
  ui.loadVal.textContent = String(LOAD);
  applyLoad();

  // #region bench-pipelines
  const pipelines = {
    hb: {
      label: 'hb-gpu (WebGL2)',
      el: glCanvas,
      frame(t) {
        const runs = [];
        for (let k = 0; k < COPIES; k++) {
          for (let i = 0; i < ROWS; i++) {
            runs.push({
              shaped,
              x: PAD * dpr,
              y: (PAD + i * LINE_H + Math.min(LINE_H, MAX_SIZE) * 0.8 + copyOffset(k)) * dpr,
              sizePx: sizeAt(t, i, k) * dpr,
            });
          }
        }
        renderer.setRuns(runs);
        renderer.render({
          stemDarkening: true,
          gamma: 0.75,
          foreground: theme.fg,
          background: theme.bg,
        });
      },
    },
    c2d: {
      label: 'canvas 2D fillText',
      el: c2dCanvas,
      frame(t) {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx2d.fillStyle = theme.css.bg;
        ctx2d.fillRect(0, 0, stageW, stageH);
        ctx2d.fillStyle = theme.css.fg;
        ctx2d.textBaseline = 'alphabetic';
        for (let k = 0; k < COPIES; k++) {
          for (let i = 0; i < ROWS; i++) {
            ctx2d.font = `${sizeAt(t, i, k)}px ${family}`;
            ctx2d.fillText(rowText, PAD, PAD + i * LINE_H + Math.min(LINE_H, MAX_SIZE) * 0.8 + copyOffset(k));
          }
        }
      },
    },
    dom: {
      label: 'DOM text',
      el: domHost,
      frame(t) {
        for (let k = 0; k < COPIES; k++) {
          for (let i = 0; i < ROWS; i++) {
            domRows[k * ROWS + i].style.fontSize = `${sizeAt(t, i, k)}px`;
          }
        }
      },
    },
  };
  // #endregion bench-pipelines

  function showOnly(name) {
    for (const [key, p] of Object.entries(pipelines)) {
      p.el.style.display = key === name ? 'block' : 'none';
    }
  }

  let watchToken = 0;

  function percentile(sorted, p) {
    return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100))];
  }

  /** Runs one pipeline, returns frame-interval stats (null when aborted). */
  function measure(name, onProgress) {
    return new Promise((resolve) => {
      const p = pipelines[name];
      showOnly(name);
      const deltas = [];
      let prev = null;
      let phase = 'warm';
      const t0 = performance.now();
      const total = WARM_MS + SAMPLE_MS;
      const tEnd = { warm: t0 + WARM_MS, sample: 0 };
      function tick(now) {
        if (abortRun) {
          resolve(null);
          return;
        }
        p.frame(now);
        onProgress?.(Math.min(1, (now - t0) / total));
        if (phase === 'sample' && prev !== null) deltas.push(now - prev);
        prev = now;
        if (phase === 'warm' && now >= tEnd.warm) {
          phase = 'sample';
          tEnd.sample = now + SAMPLE_MS;
          prev = null;
        } else if (phase === 'sample' && now >= tEnd.sample) {
          const sorted = [...deltas].sort((a, b) => a - b);
          const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length;
          resolve({
            name,
            label: p.label,
            frames: deltas.length,
            fps: 1000 / avg,
            avg,
            p95: percentile(sorted, 95),
            p99: percentile(sorted, 99),
            worst: sorted[sorted.length - 1],
            deltas,
          });
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /** Idle refresh-rate estimate (median rAF delta with no work). */
  function estimateRefresh() {
    return new Promise((resolve) => {
      const deltas = [];
      let prev = null;
      function tick(now) {
        if (prev !== null) deltas.push(now - prev);
        prev = now;
        if (deltas.length >= 30) {
          deltas.sort((a, b) => a - b);
          resolve(1000 / deltas[Math.floor(deltas.length / 2)]);
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  let benchRunning = false;
  let abortRun = false;
  let stageVisible = false;

  const segs = new Map(
    [...(ui.progress?.querySelectorAll('.seg') ?? [])].map((el) => [el.dataset.pipe, el]),
  );

  function setFill(name, frac) {
    const seg = segs.get(name);
    if (seg) seg.querySelector('.fill').style.width = `${(frac * 100).toFixed(1)}%`;
  }

  function resultRow(r, budget) {
    const over = r.deltas.filter((d) => d > budget * 1.5).length;
    const missed = `${((over / r.frames) * 100).toFixed(1)}%`;
    return `<tr><td>${r.label}</td><td>${r.fps.toFixed(1)}</td><td>${r.avg.toFixed(2)}</td><td>${r.p95.toFixed(2)}</td><td>${r.p99.toFixed(2)}</td><td>${r.worst.toFixed(1)}</td><td>${missed}</td></tr>`;
  }

  async function runBench() {
    watchToken++; // stop any live watch
    benchRunning = true;
    abortRun = false;
    for (const el of controls) el.disabled = true;
    ui.results.innerHTML = '';
    if (ui.progress) {
      ui.progress.hidden = false;
      for (const name of segs.keys()) {
        setFill(name, 0);
        segs.get(name).classList.remove('active');
      }
    }
    ui.live.textContent = 'estimating refresh rate…';
    const refresh = await estimateRefresh();
    const budget = 1000 / refresh;
    ui.results.innerHTML =
      '<table><tr><th>pipeline</th><th>fps</th><th>avg ms</th><th>p95 ms</th><th>p99 ms</th><th>worst ms</th><th>frames > 1.5x budget</th></tr></table>';
    const table = ui.results.querySelector('table');
    const names = ['hb', 'c2d', 'dom'];
    const results = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      segs.get(name)?.classList.add('active');
      ui.live.textContent =
        `measuring ${i + 1}/3: ${pipelines[name].label} (${glyphsPerFrame()} glyphs/frame)`;
      const r = await measure(name, (frac) => setFill(name, frac));
      segs.get(name)?.classList.remove('active');
      if (!r) break; // aborted: demo left the screen or the tab hid
      setFill(name, 1);
      results.push(r);
      table.insertAdjacentHTML('beforeend', resultRow(r, budget));
    }
    if (results.length === names.length) {
      ui.live.textContent =
        `display ~${refresh.toFixed(0)} Hz (budget ${budget.toFixed(2)} ms), ` +
        `${ROWS} rows x ${COPIES} copies x ${shaped.length} glyphs = ${glyphsPerFrame()} glyphs/frame, ` +
        `zoom ${MIN_SIZE}-${MAX_SIZE}px${ui.phase.checked ? ', per-row phase' : ''}` +
        `${ui.quant.checked ? ', quantized (cache-friendly)' : ', continuous (cache-hostile)'}`;
      // Strip raw deltas from the exposed results (keep the JSON small).
      window.__benchResults = {
        refresh,
        glyphsPerFrame: glyphsPerFrame(),
        quantized: ui.quant.checked,
        perRowPhase: ui.phase.checked,
        load: LOAD,
        results: results.map(({ deltas, ...rest }) => rest),
      };
    } else {
      ui.live.textContent = 'benchmark stopped: the demo scrolled out of view. Run it again.';
    }
    for (const el of controls) el.disabled = false;
    benchRunning = false;
    if (stageVisible) watchLoop(watchValue());
    return window.__benchResults;
  }

  async function watchLoop(name) {
    const token = ++watchToken;
    showOnly(name);
    const recent = [];
    function tick(now) {
      if (token !== watchToken) return;
      pipelines[name].frame(now);
      recent.push(now);
      while (recent.length > 120) recent.shift();
      if (recent.length > 10) {
        const span = recent[recent.length - 1] - recent[0];
        ui.live.textContent =
          `${pipelines[name].label}: ${(((recent.length - 1) / span) * 1000).toFixed(1)} fps ` +
          `(${glyphsPerFrame()} glyphs/frame)`;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  ui.load.addEventListener('input', () => {
    LOAD = Number(ui.load.value);
    ui.loadVal.textContent = String(LOAD);
    applyLoad();
  });

  ui.run.addEventListener('click', runBench);
  for (const r of ui.watchRadios) {
    r.addEventListener('change', () => {
      if (!benchRunning) watchLoop(watchValue());
    });
  }

  // The idle watch loop renders continuously, so it only runs while the
  // stage is on screen (the observer fires once at mount, which also starts
  // the initial animation when visible). A benchmark run aborts when the
  // stage scrolls away or the tab hides: rAF pauses on hidden tabs, which
  // would corrupt the frame intervals anyway, and readers should not pay
  // for a benchmark they are not looking at.
  const visibility = new IntersectionObserver((entries) => {
    stageVisible = entries[0].isIntersecting;
    if (benchRunning) {
      if (!stageVisible) abortRun = true;
      return;
    }
    if (stageVisible) watchLoop(watchValue());
    else watchToken++;
  });
  visibility.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && benchRunning) abortRun = true;
  });

  window.__bench = {
    run: runBench,
    pipelines: Object.keys(pipelines),
    // Synchronous draw + readback for tests (readPixels after present races
    // with the cleared back buffer when preserveDrawingBuffer is false).
    drawHbOnce(t = 0) {
      showOnly('hb');
      pipelines.hb.frame(t);
      return renderer.readStats();
    },
  };
  window.__benchReady = true;
}
