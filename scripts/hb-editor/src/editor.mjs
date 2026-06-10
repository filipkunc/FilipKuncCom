// DOM glue: hidden-textarea input capture + mouse interaction + scrolling +
// rendering. All editing logic lives in doc.mjs; this file only translates.
import { createDoc } from './doc.mjs';
import { createTextRenderer } from './renderer.mjs';
import { themeColors, onThemeChange } from './theme.mjs';

const SELECTION_BG = [0.15, 0.39, 0.92, 1.0]; // #2563eb
const SELECTION_FG = [1, 1, 1, 1];
const PADDING = 12; // CSS px text inset
// Edge-coverage gamma. Empirically calibrated against DOM text (Skia ships
// gamma/contrast-boosted glyph masks; raw linear coverage reads thinner):
// 0.7-0.8 matches DOM weight on a ~1.45x display, grayscale AA. 1.0 = off.
const COVERAGE_GAMMA = 0.75;

export function createEditor({ canvas, textarea, hb, font, sizePx = 28 }) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) throw new Error('WebGL2 not available');

  let renderer = createTextRenderer(gl, hb, font);
  let dpr = 1;
  let doc = createDoc(font, { sizePx: sizePx }); // CSS px; scaled at draw time
  let caretVisible = true;
  let blinkTimer = null;
  let composing = false;

  /** Swaps the font, preserving text and cursor. Listeners stay attached. */
  function setFont(newFont) {
    const old = doc;
    renderer = createTextRenderer(gl, hb, newFont);
    doc = createDoc(newFont, { sizePx });
    doc.setText(old.text);
    doc.setCursorIndex(old.cursor);
    ensureCaretVisible();
    draw();
  }

  // Scroll offset in CSS px. The caret is kept visible after every change,
  // so text past the box edge stays editable.
  let scrollX = 0;
  let scrollY = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function contentSize() {
    const lines = doc.layout();
    let w = 0;
    for (const l of lines) w = Math.max(w, l.width);
    return { w, h: lines.length * doc.lineHeight() };
  }

  function viewSize() {
    return {
      w: canvas.clientWidth - 2 * PADDING,
      h: canvas.clientHeight - 2 * PADDING,
    };
  }

  function clampScroll() {
    const c = contentSize();
    const v = viewSize();
    scrollX = Math.max(0, Math.min(scrollX, Math.max(0, c.w - v.w + 2)));
    scrollY = Math.max(0, Math.min(scrollY, Math.max(0, c.h - v.h)));
  }

  function ensureCaretVisible() {
    const r = doc.caretRect();
    const v = viewSize();
    if (r.x < scrollX) scrollX = r.x;
    else if (r.x > scrollX + v.w) scrollX = r.x - v.w;
    if (r.y < scrollY) scrollY = r.y;
    else if (r.y + r.h > scrollY + v.h) scrollY = r.y + r.h - v.h;
    clampScroll();
  }

  function draw() {
    resize();
    const theme = themeColors();
    // doc works in CSS px; scale geometry to device px with scroll applied.
    const ox = (PADDING - scrollX) * dpr;
    const oy = (PADDING - scrollY) * dpr;
    const lines = doc.layout();
    renderer.setRuns(
      lines.map((l) => ({
        shaped: l.shaped,
        x: ox,
        y: oy + l.baseline * dpr,
        sizePx: doc.sizePx * dpr,
      })),
    );
    renderer.beginFrame(theme.bg);
    const selRects = doc.selectionRects().map((r) => ({
      x: ox + r.x * dpr, y: oy + r.y * dpr, w: r.w * dpr, h: r.h * dpr,
    }));
    renderer.drawRects(selRects, SELECTION_BG);
    renderer.drawText({ foreground: theme.fg, stemDarkening: true, gamma: COVERAGE_GAMMA });
    // Selected text in white, scissored to the highlight. A ligature glyph
    // straddling the selection edge renders two-tone, which whole-cluster
    // (DirectWrite-style) selection cannot do.
    for (const r of selRects) {
      renderer.drawTextClipped(r, {
        foreground: SELECTION_FG,
        stemDarkening: true,
        gamma: COVERAGE_GAMMA,
      });
    }
    if (caretVisible && document.activeElement === textarea) {
      const r = doc.caretRect();
      renderer.drawRects(
        [{ x: ox + r.x * dpr, y: oy + r.y * dpr, w: Math.max(1, dpr), h: r.h * dpr }],
        theme.fg,
      );
    }
  }

  function restartBlink() {
    caretVisible = true;
    clearInterval(blinkTimer);
    blinkTimer = setInterval(() => {
      caretVisible = !caretVisible;
      draw();
    }, 530);
  }

  function changed() {
    restartBlink();
    ensureCaretVisible();
    draw();
  }

  // --- Keyboard ---

  textarea.addEventListener('keydown', (ev) => {
    if (composing) return;
    const extend = ev.shiftKey;
    let handled = true;
    switch (ev.key) {
      case 'ArrowLeft': doc.moveLeft(extend); break;
      case 'ArrowRight': doc.moveRight(extend); break;
      case 'ArrowUp': doc.moveVertical(-1, extend); break;
      case 'ArrowDown': doc.moveVertical(1, extend); break;
      case 'Home': doc.moveHome(extend); break;
      case 'End': doc.moveEnd(extend); break;
      case 'Backspace': doc.deleteBackward(); break;
      case 'Delete': doc.deleteForward(); break;
      case 'Enter': doc.insert('\n'); break;
      case 'a':
        if (ev.ctrlKey || ev.metaKey) doc.selectAll();
        else handled = false;
        break;
      default:
        handled = false;
    }
    if (handled) {
      ev.preventDefault();
      changed();
    }
  });

  // #region hidden-textarea
  // Regular typing (including dead keys resolving outside composition).
  textarea.addEventListener('input', () => {
    if (composing) return;
    if (textarea.value) {
      doc.insert(textarea.value);
      textarea.value = '';
      changed();
    }
  });

  textarea.addEventListener('compositionstart', () => {
    composing = true;
  });
  textarea.addEventListener('compositionend', (ev) => {
    composing = false;
    textarea.value = '';
    if (ev.data) {
      doc.insert(ev.data);
      changed();
    }
  });

  // --- Clipboard (events fire on the focused textarea) ---

  function selectedText() {
    const range = doc.selectionRange();
    return range ? doc.text.slice(range[0], range[1]) : '';
  }

  textarea.addEventListener('copy', (ev) => {
    ev.preventDefault();
    ev.clipboardData.setData('text/plain', selectedText());
  });
  textarea.addEventListener('cut', (ev) => {
    ev.preventDefault();
    ev.clipboardData.setData('text/plain', selectedText());
    doc.deleteBackward(); // deletes the selection
    changed();
  });
  textarea.addEventListener('paste', (ev) => {
    ev.preventDefault();
    const t = ev.clipboardData.getData('text/plain');
    if (t) {
      doc.insert(t.replace(/\r\n?/g, '\n'));
      changed();
    }
  });
  // #endregion hidden-textarea

  // --- Mouse ---

  function docPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left - PADDING + scrollX,
      y: ev.clientY - rect.top - PADDING + scrollY,
    };
  }

  // Wheel scrolls the editor only when its content actually overflows, so a
  // short document never traps the page scroll.
  canvas.addEventListener(
    'wheel',
    (ev) => {
      const c = contentSize();
      const v = viewSize();
      const overflowX = c.w > v.w;
      const overflowY = c.h > v.h;
      if (!overflowX && !overflowY) return;
      if (ev.shiftKey || (!overflowY && overflowX)) {
        scrollX += ev.deltaY + ev.deltaX;
      } else {
        scrollY += ev.deltaY;
        scrollX += ev.deltaX;
      }
      clampScroll();
      ev.preventDefault();
      draw();
    },
    { passive: false },
  );

  let dragging = false;
  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    textarea.focus({ preventScroll: true });
    const p = docPoint(ev);
    doc.setCursorFromPoint(p.x, p.y, ev.shiftKey);
    dragging = true;
    canvas.setPointerCapture(ev.pointerId);
    changed();
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const p = docPoint(ev);
    doc.setCursorFromPoint(p.x, p.y, true);
    // Auto-scroll while drag-selecting past the edge: keyboard movement gets
    // caret-follow via changed(), the drag path needs it too.
    ensureCaretVisible();
    draw();
  });
  canvas.addEventListener('pointerup', (ev) => {
    dragging = false;
    canvas.releasePointerCapture(ev.pointerId);
  });

  textarea.addEventListener('focus', changed);
  textarea.addEventListener('blur', () => {
    clearInterval(blinkTimer);
    caretVisible = false;
    draw();
  });
  window.addEventListener('resize', draw);
  onThemeChange(draw);

  draw();

  return {
    get doc() { return doc; },
    get renderer() { return renderer; },
    draw,
    setFont,
    focus: () => textarea.focus({ preventScroll: true }),
    getState: () => ({
      text: doc.text,
      cursor: doc.cursor,
      anchor: doc.anchor,
      scroll: { x: scrollX, y: scrollY },
    }),
  };
}
