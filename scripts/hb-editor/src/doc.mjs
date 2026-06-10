// Editor document model: text + cursor/selection + shaped layout + caret math.
// Pure logic (no DOM, no GL) so it runs under node:test with the wasm font.
//
// Indices are UTF-16 code units (JS string indices); the shim shapes UTF-16 so
// HarfBuzz cluster values land in the same space.
//
// Caret stops are GRAPHEME boundaries (Intl.Segmenter), not cluster
// boundaries. The difference matters exactly twice:
//  - combining marks: one grapheme, one cluster -> caret skips the whole
//    thing as a unit (correct);
//  - ligatures (fi, ffi): several graphemes in ONE cluster -> the caret must
//    stop INSIDE the ligature glyph. The x position there comes from the
//    font's GDEF ligature carets when present, otherwise the cluster advance
//    is divided evenly per grapheme (the same fallback Chromium/Blink uses).
// This is the failure mode DirectWrite-based editors hit with partial
// ligature selection; doing it at this layer means caret movement, hit
// testing, and selection rects all get it right for free.
// LTR-only for now (RTL runs would need visual reordering of boundary x).

export function createDoc(font, { sizePx = 32, lineGapPx = 0 } = {}) {
  let text = '';
  let cursor = 0; // caret index
  let anchor = null; // selection anchor index, null = no selection
  let layoutCache = null;

  const upem = font.upem;
  const fe = font.fontExtents;
  const scale = () => sizePx / upem;
  const ascent = () => fe.ascender * scale();
  const lineHeight = () =>
    (fe.ascender - fe.descender + fe.lineGap) * scale() + lineGapPx;

  function invalidate() {
    layoutCache = null;
  }

  const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

  /**
   * Lines with shaped glyphs and caret boundaries.
   * Each line: {start, end, shaped, boundaries: [{index, x}], width, baseline}.
   * `boundaries` (one per grapheme boundary) is ascending by index, always
   * includes line start (x 0) and line end (x = width). `end` excludes the
   * trailing newline.
   */
  function layout() {
    if (layoutCache) return layoutCache;
    const s = scale();
    const lines = [];
    let start = 0;
    let lineNo = 0;
    for (;;) {
      const nl = text.indexOf('\n', start);
      const end = nl === -1 ? text.length : nl;
      const lineText = text.slice(start, end);
      const shaped = lineText ? font.shape(lineText) : [];

      // Group glyphs into cluster runs (LTR: clusters non-decreasing).
      // Each: line-local [index, nextIndex) span, pen x, total advance, and
      // the first gid (the ligature glyph, for GDEF caret lookup).
      const clusters = [];
      let x = 0;
      for (const g of shaped) {
        const last = clusters[clusters.length - 1];
        if (last && last.index === g.cluster) {
          last.advance += g.xAdvance * s;
        } else {
          clusters.push({ index: g.cluster, x, advance: g.xAdvance * s, gid: g.gid });
        }
        x += g.xAdvance * s;
      }
      const width = x;
      for (let i = 0; i < clusters.length; i++) {
        clusters[i].nextIndex = i + 1 < clusters.length ? clusters[i + 1].index : lineText.length;
      }

      // Caret stops at grapheme boundaries; x inside a multi-grapheme
      // cluster (ligature) from GDEF carets or even division.
      const graphemeEnds = [];
      for (const seg of graphemeSegmenter.segment(lineText)) {
        graphemeEnds.push(seg.index + seg.segment.length);
      }
      // #region ligature-carets
      const boundaries = [{ index: start, x: 0 }];
      let ci = 0;
      for (const b of graphemeEnds) {
        while (ci < clusters.length && clusters[ci].nextIndex <= b) ci++;
        if (ci >= clusters.length || b <= clusters[ci].index) {
          // Boundary at (or before) a cluster start: x is the cluster pen x,
          // or full width when past the last cluster.
          const c = clusters[ci];
          boundaries.push({ index: start + b, x: c && b <= c.index ? c.x : width });
          continue;
        }
        // Boundary strictly inside cluster ci: j-th of n graphemes.
        const c = clusters[ci];
        const inside = graphemeEnds.filter((e) => e > c.index && e < c.nextIndex);
        const n = inside.length + 1;
        const j = inside.indexOf(b) + 1;
        const carets = font.ligCarets(c.gid);
        const offset = carets.length >= n - 1 ? carets[j - 1] * s : (c.advance * j) / n;
        boundaries.push({ index: start + b, x: c.x + offset });
      }
      // #endregion ligature-carets
      if (boundaries[boundaries.length - 1].index !== end) {
        boundaries.push({ index: end, x: width });
      }

      lines.push({
        start,
        end,
        shaped,
        boundaries,
        width,
        baseline: ascent() + lineNo * lineHeight(),
      });
      if (nl === -1) break;
      start = nl + 1;
      lineNo++;
    }
    layoutCache = lines;
    return lines;
  }

  function lineAt(index) {
    const lines = layout();
    for (const line of lines) {
      if (index <= line.end) return line;
    }
    return lines[lines.length - 1];
  }

  function caretX(index) {
    const line = lineAt(index);
    let best = line.boundaries[0];
    for (const b of line.boundaries) {
      if (b.index <= index) best = b;
      else break;
    }
    return { line, x: best.x };
  }

  /** Caret rectangle in pixels (y down, top-left origin). */
  function caretRect() {
    const { line, x } = caretX(cursor);
    const top = line.baseline - ascent();
    return { x, y: top, w: Math.max(1, sizePx / 16), h: lineHeight() };
  }

  function selectionRange() {
    if (anchor === null || anchor === cursor) return null;
    return anchor < cursor ? [anchor, cursor] : [cursor, anchor];
  }

  /** Selection highlight rects, one per touched line. */
  function selectionRects() {
    const range = selectionRange();
    if (!range) return [];
    const [a, b] = range;
    const rects = [];
    for (const line of layout()) {
      // Selectable span on this line includes its trailing newline position.
      const selEnd = Math.min(b, line.end);
      const selStart = Math.max(a, line.start);
      if (selStart > line.end || b <= line.start) continue;
      if (selStart >= selEnd && !(a <= line.end && b > line.end)) continue;
      const x0 = caretXOnLine(line, selStart);
      // Selection crossing the newline extends past the line width a bit.
      const x1 = b > line.end ? line.width + sizePx * 0.25 : caretXOnLine(line, selEnd);
      const top = line.baseline - ascent();
      if (x1 > x0) rects.push({ x: x0, y: top, w: x1 - x0, h: lineHeight() });
    }
    return rects;
  }

  function caretXOnLine(line, index) {
    let best = line.boundaries[0];
    for (const b of line.boundaries) {
      if (b.index <= index) best = b;
      else break;
    }
    return best.x;
  }

  function clampToBoundary(index) {
    const line = lineAt(index);
    let best = line.start;
    for (const b of line.boundaries) {
      if (b.index <= index) best = b.index;
      else break;
    }
    return best;
  }

  function prevPosition(index) {
    if (index === 0) return 0;
    const line = lineAt(index);
    if (index === line.start) return index - 1; // step over the newline
    let prev = line.start;
    for (const b of line.boundaries) {
      if (b.index < index) prev = b.index;
      else break;
    }
    return prev;
  }

  function nextPosition(index) {
    if (index >= text.length) return text.length;
    const line = lineAt(index);
    if (index === line.end) return index + 1; // step over the newline
    for (const b of line.boundaries) {
      if (b.index > index) return b.index;
    }
    return line.end;
  }

  function setCursor(index, extend = false) {
    if (extend) {
      if (anchor === null) anchor = cursor;
    } else {
      anchor = null;
    }
    cursor = Math.max(0, Math.min(text.length, index));
  }

  function deleteRange(a, b) {
    text = text.slice(0, a) + text.slice(b);
    cursor = a;
    anchor = null;
    invalidate();
  }

  return {
    get text() { return text; },
    get cursor() { return cursor; },
    get anchor() { return anchor; },
    get sizePx() { return sizePx; },
    lineHeight,
    layout,
    caretRect,
    selectionRects,
    selectionRange,

    setText(t) {
      text = t;
      cursor = Math.min(cursor, text.length);
      anchor = null;
      invalidate();
    },

    insert(str) {
      const range = selectionRange();
      if (range) deleteRange(range[0], range[1]);
      text = text.slice(0, cursor) + str + text.slice(cursor);
      cursor += str.length;
      anchor = null;
      invalidate();
    },

    deleteBackward() {
      const range = selectionRange();
      if (range) return deleteRange(range[0], range[1]);
      if (cursor === 0) return;
      deleteRange(prevPosition(cursor), cursor);
    },

    deleteForward() {
      const range = selectionRange();
      if (range) return deleteRange(range[0], range[1]);
      if (cursor >= text.length) return;
      deleteRange(cursor, nextPosition(cursor));
    },

    moveLeft(extend = false) {
      const range = selectionRange();
      if (range && !extend) return setCursor(range[0]);
      setCursor(prevPosition(cursor), extend);
    },

    moveRight(extend = false) {
      const range = selectionRange();
      if (range && !extend) return setCursor(range[1]);
      setCursor(nextPosition(cursor), extend);
    },

    moveHome(extend = false) {
      setCursor(lineAt(cursor).start, extend);
    },

    moveEnd(extend = false) {
      setCursor(lineAt(cursor).end, extend);
    },

    moveVertical(dir, extend = false) {
      const lines = layout();
      const { line, x } = caretX(cursor);
      const li = lines.indexOf(line) + dir;
      if (li < 0) return setCursor(0, extend);
      if (li >= lines.length) return setCursor(text.length, extend);
      setCursor(indexForX(lines[li], x), extend);
    },

    selectAll() {
      anchor = 0;
      cursor = text.length;
    },

    /** Maps a pixel point to a caret index (nearest boundary). */
    indexFromPoint(x, y) {
      const lines = layout();
      const li = Math.max(0, Math.min(lines.length - 1, Math.floor(y / lineHeight())));
      return indexForX(lines[li], x);
    },

    setCursorFromPoint(x, y, extend = false) {
      setCursor(this.indexFromPoint(x, y), extend);
    },

    /** Places the caret at the nearest boundary at or before `index`. */
    setCursorIndex(index, extend = false) {
      setCursor(clampToBoundary(Math.max(0, Math.min(text.length, index))), extend);
    },

    clampToBoundary,
  };

  function indexForX(line, x) {
    let best = line.boundaries[0];
    let bestDist = Infinity;
    for (const b of line.boundaries) {
      const d = Math.abs(b.x - x);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best.index;
  }
}
