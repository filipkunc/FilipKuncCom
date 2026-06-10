import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadHb, SHADER, STAGE, LANG } from '../src/hb.mjs';

const hb = await loadHb();
const fontBytes = await readFile(new URL('../fonts/Inter.ttf', import.meta.url));
const font = hb.createFont(new Uint8Array(fontBytes));

test('font loads with sane metrics', () => {
  assert.ok(font.upem >= 1000, `upem ${font.upem}`);
  assert.ok(font.glyphCount > 100, `glyphCount ${font.glyphCount}`);
});

test('shaping ASCII produces positioned glyphs', () => {
  const glyphs = font.shape('AV');
  assert.equal(glyphs.length, 2);
  for (const g of glyphs) {
    assert.notEqual(g.gid, 0, 'no .notdef');
    assert.ok(g.xAdvance > 0, `advance ${g.xAdvance}`);
  }
  assert.notEqual(glyphs[0].gid, glyphs[1].gid);
  assert.deepEqual(glyphs.map((g) => g.cluster), [0, 1]);
});

test('shaping applies kerning or at least matches per-glyph advances', () => {
  const pair = font.shape('AV').reduce((s, g) => s + g.xAdvance, 0);
  const solo =
    font.shape('A').reduce((s, g) => s + g.xAdvance, 0) +
    font.shape('V').reduce((s, g) => s + g.xAdvance, 0);
  assert.ok(pair <= solo, `kerned ${pair} vs unkerned ${solo}`);
});

test('clusters are UTF-16 code-unit (JS string) indices', () => {
  const glyphs = font.shape('a\u0301b'); // a + combining acute + b
  assert.ok(glyphs.length >= 2);
  for (const g of glyphs) assert.notEqual(g.gid, 0);
  const last = glyphs[glyphs.length - 1];
  assert.equal(last.cluster, 2, 'b starts at JS string index 2');
  const clusters = [...new Set(glyphs.map((g) => g.cluster))].sort((x, y) => x - y);
  assert.deepEqual(clusters, [0, 2], 'a+mark share cluster 0');
});

test('font vertical metrics are sane', () => {
  const e = font.fontExtents;
  assert.ok(e.ascender > 0);
  assert.ok(e.descender < 0);
  assert.ok(e.ascender - e.descender >= font.upem * 0.8);
});

test('encoding a glyph yields RGBA16I texels with sane extents', () => {
  const [a] = font.shape('A');
  const enc = font.encodeGlyph(a.gid);
  assert.ok(enc, 'A has ink');
  assert.ok(enc.texels.length > 0);
  assert.equal(enc.texels.length % 8, 0, 'texels are 8-byte RGBA16I');
  // hb_glyph_extents_t convention: yBearing = top, height extends DOWN (negative).
  assert.ok(enc.extents.width > 0 && enc.extents.height < 0);
  assert.ok(enc.extents.yBearing > 0, 'Y-up: top of A is above baseline');
  assert.ok(
    -enc.extents.height <= font.upem * 1.5,
    `height ${enc.extents.height} vs upem ${font.upem}`,
  );
});

test('ink-less glyphs return null (empty-blob path)', () => {
  const [space] = font.shape(' ');
  assert.notEqual(space.gid, 0);
  assert.equal(font.encodeGlyph(space.gid), null);
});

test('encoder is reusable and deterministic across glyphs', () => {
  const [a] = font.shape('A');
  const [b] = font.shape('B');
  const first = font.encodeGlyph(a.gid);
  font.encodeGlyph(b.gid);
  const again = font.encodeGlyph(a.gid);
  assert.deepEqual(again.texels, first.texels, 'same gid encodes identically');
  assert.deepEqual(again.extents, first.extents);
});

test('shader sources exist for GLSL and WGSL, both stages', () => {
  for (const lang of [LANG.GLSL, LANG.WGSL]) {
    for (const stage of [STAGE.VERTEX, STAGE.FRAGMENT]) {
      const shared = hb.shaderSource(SHADER.SHARED, stage, lang);
      assert.ok(shared && shared.length > 100, `shared stage=${stage} lang=${lang}`);
    }
    const frag = hb.shaderSource(SHADER.DRAW, STAGE.FRAGMENT, lang);
    assert.ok(frag && frag.includes('hb_gpu_draw'), `draw fragment lang=${lang}`);
  }
});

test('GLSL fragment exposes the documented entry points', () => {
  const shared = hb.shaderSource(SHADER.SHARED, STAGE.FRAGMENT, LANG.GLSL);
  const frag = hb.shaderSource(SHADER.DRAW, STAGE.FRAGMENT, LANG.GLSL);
  const all = shared + frag;
  assert.ok(all.includes('hb_gpu_draw'), 'hb_gpu_draw coverage function');
  assert.ok(all.includes('hb_gpu_stem_darken'), 'stem darkening helper');
});
