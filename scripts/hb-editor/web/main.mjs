import { loadHb } from '../src/hb.mjs';
import { createTextRenderer } from '../src/renderer.mjs';

const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
const ui = {
  text: document.getElementById('text'),
  size: document.getElementById('size'),
  sizeVal: document.getElementById('sizeVal'),
  darken: document.getElementById('darken'),
  gamma: document.getElementById('gamma'),
  gammaVal: document.getElementById('gammaVal'),
  debug: document.getElementById('debug'),
};

const gl = canvas.getContext('webgl2', {
  alpha: false,
  antialias: false,
  premultipliedAlpha: true,
});
if (!gl) {
  status.textContent = 'WebGL2 not available';
  throw new Error('WebGL2 not available');
}

const hb = await loadHb();
const fontBytes = new Uint8Array(
  await (await fetch('../fonts/Inter.ttf')).arrayBuffer(),
);
const font = hb.createFont(fontBytes);
const renderer = createTextRenderer(gl, hb, font);

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return dpr;
}

function draw(text = ui.text.value, sizePx = Number(ui.size.value), opts = {}) {
  const dpr = resize();
  const t0 = performance.now();
  const shaped = font.shape(text);
  const baseline = canvas.height * 0.62;
  renderer.setText(shaped, { x: 16 * dpr, y: baseline, sizePx: sizePx * dpr });
  renderer.render({
    stemDarkening: opts.stemDarkening ?? ui.darken.checked,
    gamma: opts.gamma ?? Number(ui.gamma.value),
    debug: opts.debug ?? ui.debug.checked,
  });
  const ms = performance.now() - t0;
  status.textContent =
    `${shaped.length} glyphs, atlas ${renderer.atlasTexels} texels, ` +
    `shape+layout+draw ${ms.toFixed(2)} ms (CPU side)`;
  return renderer.readStats();
}

for (const el of [ui.text, ui.size, ui.darken, ui.gamma, ui.debug]) {
  el.addEventListener('input', () => {
    ui.sizeVal.textContent = ui.size.value;
    ui.gammaVal.textContent = Number(ui.gamma.value).toFixed(2);
    draw();
  });
}
window.addEventListener('resize', () => draw());

draw();

// Hooks for the Playwright spec.
window.__hbe = { draw, font, renderer };
window.__hbeReady = true;
