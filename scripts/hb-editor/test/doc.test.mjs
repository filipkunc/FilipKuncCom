import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadHb } from '../src/hb.mjs';
import { createDoc } from '../src/doc.mjs';

const hb = await loadHb();
const fontBytes = await readFile(new URL('../fonts/Inter.ttf', import.meta.url));
const font = hb.createFont(new Uint8Array(fontBytes));

function doc(text = '', cursor = text.length) {
  const d = createDoc(font, { sizePx: 32 });
  d.setText(text);
  d.moveHome();
  for (let i = 0; i < cursor; i++) d.moveRight();
  return d;
}

test('insert and cursor advance', () => {
  const d = doc();
  d.insert('hi');
  assert.equal(d.text, 'hi');
  assert.equal(d.cursor, 2);
});

test('backspace deletes one character', () => {
  const d = doc('abc');
  d.deleteBackward();
  assert.equal(d.text, 'ab');
  assert.equal(d.cursor, 2);
});

test('backspace deletes a whole combining-mark cluster', () => {
  const d = doc('xé'); // x + (e + combining acute)
  d.deleteBackward();
  assert.equal(d.text, 'x', 'e+mark deleted as one unit');
  assert.equal(d.cursor, 1);
});

test('arrows step over cluster boundaries, not code units', () => {
  const d = doc('éb', 0);
  d.moveRight();
  assert.equal(d.cursor, 2, 'right from 0 skips the combining mark');
  d.moveRight();
  assert.equal(d.cursor, 3);
  d.moveLeft();
  assert.equal(d.cursor, 2);
  d.moveLeft();
  assert.equal(d.cursor, 0);
});

test('newlines split into lines with monotonic baselines', () => {
  const d = doc('one\ntwo\n\nfour');
  const lines = d.layout();
  assert.equal(lines.length, 4);
  assert.deepEqual(lines.map((l) => d.text.slice(l.start, l.end)), ['one', 'two', '', 'four']);
  for (let i = 1; i < lines.length; i++) {
    assert.ok(lines[i].baseline > lines[i - 1].baseline);
  }
});

test('arrow right steps across the newline', () => {
  const d = doc('ab\ncd', 2);
  d.moveRight();
  assert.equal(d.cursor, 3, 'into start of second line');
});

test('backspace at line start joins lines', () => {
  const d = doc('ab\ncd', 3);
  d.deleteBackward();
  assert.equal(d.text, 'abcd');
  assert.equal(d.cursor, 2);
});

test('home/end and vertical movement', () => {
  const d = doc('short\nlonger line', 0);
  d.moveEnd();
  assert.equal(d.cursor, 5);
  d.moveVertical(1);
  const line2 = d.layout()[1];
  assert.ok(d.cursor >= line2.start && d.cursor <= line2.end);
  d.moveVertical(-1);
  assert.ok(d.cursor <= 5);
});

test('selection: shift-arrows then typing replaces', () => {
  const d = doc('hello', 0);
  d.moveRight(true);
  d.moveRight(true);
  assert.deepEqual(d.selectionRange(), [0, 2]);
  d.insert('HE');
  assert.equal(d.text, 'HEllo');
  assert.equal(d.selectionRange(), null);
});

test('selectAll + deleteBackward clears', () => {
  const d = doc('hello\nworld');
  d.selectAll();
  d.deleteBackward();
  assert.equal(d.text, '');
  assert.equal(d.cursor, 0);
});

test('caret rect advances with cursor and tracks lines', () => {
  const d = doc('mm\nmm', 0);
  const r0 = d.caretRect();
  d.moveRight();
  const r1 = d.caretRect();
  assert.ok(r1.x > r0.x, 'caret moves right within a line');
  d.moveVertical(1);
  const r2 = d.caretRect();
  assert.ok(r2.y > r1.y, 'caret moves down across lines');
  assert.ok(r2.h > 0);
});

test('selection rects cover one rect per touched line', () => {
  const d = doc('aaa\nbbb', 1);
  d.moveVertical(1, true); // extend selection into line 2
  const rects = d.selectionRects();
  assert.equal(rects.length, 2);
  assert.ok(rects[0].w > 0 && rects[1].w > 0);
  assert.ok(rects[1].y > rects[0].y);
});

test('indexFromPoint maps clicks to nearest boundary', () => {
  const d = doc('iiii\nWWWW');
  const lines = d.layout();
  assert.equal(d.indexFromPoint(-5, 0), 0, 'left of line 1');
  assert.equal(d.indexFromPoint(lines[0].width + 50, 0), lines[0].end, 'right of line 1');
  const y2 = lines[1].baseline;
  assert.equal(d.indexFromPoint(1e9, y2), d.text.length, 'far right of line 2');
  const mid = d.indexFromPoint(lines[1].width / 2, y2);
  assert.ok(mid > lines[1].start && mid < lines[1].end, 'middle of line 2');
});

test('kerning does not desync caret x from rendering advances', () => {
  // Caret x must equal the sum of shaped advances, not per-character widths.
  const d = doc('AV', 2);
  const line = d.layout()[0];
  const r = d.caretRect();
  assert.ok(Math.abs(r.x - line.width) < 0.001);
});

// --- Ligatures (EB Garamond merges fi/ffi into one cluster; Inter does not
// ligate, so these run on a second font). The DirectWrite failure mode this
// guards against: caret/selection snapping to whole ligatures.

const garamond = hb.createFont(
  new Uint8Array(await readFile(new URL('../fonts/EBGaramond.ttf', import.meta.url))),
);

function gdoc(text, cursor = text.length) {
  const d = createDoc(garamond, { sizePx: 32 });
  d.setText(text);
  d.setCursorIndex(cursor);
  return d;
}

test('precondition: EB Garamond ligates fi into one cluster', () => {
  const shaped = garamond.shape('fi');
  assert.equal(shaped.length, 1, 'fi is one glyph');
  assert.equal(shaped[0].cluster, 0);
});

test('caret stops INSIDE a ligature at an interpolated x', () => {
  const d = gdoc('fi', 0);
  const line = d.layout()[0];
  const idxs = line.boundaries.map((b) => b.index);
  assert.deepEqual(idxs, [0, 1, 2], 'boundary between f and i exists');
  const mid = line.boundaries[1];
  assert.ok(mid.x > 0 && mid.x < line.width, `0 < ${mid.x} < ${line.width}`);
});

test('arrows step through a ligature one grapheme at a time', () => {
  const d = gdoc('fix', 0);
  d.moveRight();
  assert.equal(d.cursor, 1, 'caret lands between f and i inside the ligature');
  d.moveRight();
  assert.equal(d.cursor, 2);
  d.moveLeft();
  assert.equal(d.cursor, 1);
});

test('backspace inside a ligature deletes one character, then reshaping splits it', () => {
  const d = gdoc('fi', 2);
  d.deleteBackward();
  assert.equal(d.text, 'f', 'only the i deleted');
  assert.equal(d.cursor, 1);
});

test('partial-ligature selection produces a partial rect', () => {
  const d = gdoc('fi', 0);
  d.moveRight(true); // select just the f of the fi ligature
  const line = d.layout()[0];
  const rects = d.selectionRects();
  assert.equal(rects.length, 1);
  assert.ok(rects[0].w > 0);
  assert.ok(rects[0].w < line.width, `selection ${rects[0].w} < ligature ${line.width}`);
});

test('combining marks still move as one unit in the ligating font', () => {
  const d = gdoc('a\u0301b', 0); // decomposed a-acute
  d.moveRight();
  assert.equal(d.cursor, 2, 'no caret stop inside a grapheme');
});
