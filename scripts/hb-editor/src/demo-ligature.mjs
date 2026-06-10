// Static ligature showcase: one line of EB Garamond with a selection frozen
// mid-ffi, rendered live by the same pipeline as the editor. Theme-aware.
import { loadHb } from './hb.mjs';
import { createTextRenderer } from './renderer.mjs';
import { createDoc } from './doc.mjs';
import { themeColors, onThemeChange } from './theme.mjs';

const SELECTION_BG = [0.15, 0.39, 0.92, 1.0];
const SELECTION_FG = [1, 1, 1, 1];
const PAD = 14;

export async function mountLigatureDemo(root, { fontUrl, text = 'difficult fjord ffi', sizePx = 52 }) {
  const canvas = root.querySelector('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) return;

  const [hb, fontBuf] = await Promise.all([
    loadHb(),
    fetch(fontUrl).then((r) => r.arrayBuffer()),
  ]);
  const font = hb.createFont(new Uint8Array(fontBuf));
  const renderer = createTextRenderer(gl, hb, font);
  const doc = createDoc(font, { sizePx });
  doc.setText(text);
  // Select the trailing i of the ffi ligature. The caret then sits at the
  // f|i boundary INSIDE the single glyph, and the selection splits it
  // two-tone at the same x.
  doc.moveEnd();
  doc.moveLeft(true);

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const cssH = doc.lineHeight() + 2 * PAD;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(cssH * dpr);

    const theme = themeColors();
    const pad = PAD * dpr;
    const [line] = doc.layout();
    renderer.setRuns([
      { shaped: line.shaped, x: pad, y: pad + line.baseline * dpr, sizePx: sizePx * dpr },
    ]);
    renderer.beginFrame(theme.bg);
    const selRects = doc.selectionRects().map((r) => ({
      x: pad + r.x * dpr, y: pad + r.y * dpr, w: r.w * dpr, h: r.h * dpr,
    }));
    renderer.drawRects(selRects, SELECTION_BG);
    renderer.drawText({ foreground: theme.fg, stemDarkening: true, gamma: 0.75 });
    for (const r of selRects) {
      renderer.drawTextClipped(r, { foreground: SELECTION_FG, stemDarkening: true, gamma: 0.75 });
    }
    // The caret sits at the selection start, i.e. BETWEEN two strokes of the
    // same ligature glyph. Caret inside a glyph is the whole point.
    const c = doc.caretRect();
    renderer.drawRects(
      [{ x: pad + c.x * dpr, y: pad + c.y * dpr, w: Math.max(2, dpr * 1.5), h: c.h * dpr }],
      theme.fg,
    );
  }

  window.addEventListener('resize', draw);
  onThemeChange(draw);
  draw();
  window.__ligReady = true;
}
