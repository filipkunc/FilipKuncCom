// JS wrapper over the wasm shim (src/shim.c). Everything crossing the
// boundary is flat int32/byte data; this module turns it into objects.
import createHbGpuModule from '../dist/hb-gpu.mjs';

export const SHADER = { SHARED: 0, DRAW: 1, PAINT: 2 };
export const STAGE = { VERTEX: 0, FRAGMENT: 1 };
export const LANG = { GLSL: 1, WGSL: 2, MSL: 3, HLSL: 4 };

let loaded = null;

/** Loads the wasm module once; all demos on a page share the instance. */
export function loadHb() {
  loaded ??= createHbGpuModule().then((m) => new Hb(m));
  return loaded;
}

class Hb {
  constructor(m) {
    this.m = m;
  }

  createFont(fontBytes) {
    const m = this.m;
    const ptr = m._malloc(fontBytes.length);
    m.HEAPU8.set(fontBytes, ptr);
    const ctx = m._hbe_create(ptr, fontBytes.length);
    m._free(ptr);
    if (!ctx) throw new Error('hbe_create failed: not a usable font');
    return new HbFont(m, ctx);
  }

  shaderSource(which, stage, lang) {
    const p = this.m._hbe_shader_source(which, stage, lang);
    return p ? this.m.UTF8ToString(p) : null;
  }
}

class HbFont {
  constructor(m, ctx) {
    this.m = m;
    this.ctx = ctx;
  }

  get upem() {
    return this.m._hbe_upem(this.ctx);
  }

  get glyphCount() {
    return this.m._hbe_glyph_count(this.ctx);
  }

  /** Vertical metrics in font units: {ascender, descender (negative), lineGap}. */
  get fontExtents() {
    const e = this.m._hbe_font_extents(this.ctx) >> 2;
    const heap = this.m.HEAP32;
    return { ascender: heap[e], descender: heap[e + 1], lineGap: heap[e + 2] };
  }

  /**
   * Shapes text. Cluster values are UTF-16 code-unit indices into `text`,
   * i.e. plain JS string indices.
   * Returns [{gid, cluster, xAdvance, yAdvance, xOffset, yOffset}] in font units.
   */
  shape(text) {
    const m = this.m;
    const ptr = m._malloc(text.length * 2);
    const buf = m.HEAPU16;
    const base = ptr >> 1;
    for (let i = 0; i < text.length; i++) buf[base + i] = text.charCodeAt(i);
    const n = m._hbe_shape(this.ctx, ptr, text.length);
    m._free(ptr);

    const out = m._hbe_shape_data(this.ctx) >> 2;
    const heap = m.HEAP32;
    const glyphs = new Array(n);
    for (let i = 0; i < n; i++) {
      const o = out + i * 6;
      glyphs[i] = {
        gid: heap[o],
        cluster: heap[o + 1],
        xAdvance: heap[o + 2],
        yAdvance: heap[o + 3],
        xOffset: heap[o + 4],
        yOffset: heap[o + 5],
      };
    }
    return glyphs;
  }

  /**
   * GDEF ligature caret offsets for a glyph, in font units from the glyph
   * origin (LTR). Empty array if the font provides none.
   */
  ligCarets(gid) {
    const m = this.m;
    const n = m._hbe_lig_carets(this.ctx, gid);
    if (!n) return [];
    const p = m._hbe_lig_carets_data(this.ctx) >> 2;
    return Array.from(m.HEAP32.subarray(p, p + n));
  }

  /**
   * Encodes one glyph into hb-gpu RGBA16I texel data (copied out of the heap).
   * Returns {texels: Uint8Array, extents} or null for ink-less glyphs (space).
   * Extents are font units, Y-up.
   */
  encodeGlyph(gid) {
    const m = this.m;
    const len = m._hbe_encode_glyph(this.ctx, gid);
    if (len < 0) throw new Error(`hb_gpu_draw_encode failed for gid ${gid}`);
    if (len === 0) return null;

    const dataPtr = m._hbe_blob_data(this.ctx);
    const texels = m.HEAPU8.slice(dataPtr, dataPtr + len);
    const e = m._hbe_extents(this.ctx) >> 2;
    const heap = m.HEAP32;
    return {
      texels,
      extents: {
        xBearing: heap[e],
        yBearing: heap[e + 1],
        width: heap[e + 2],
        height: heap[e + 3],
      },
    };
  }

  destroy() {
    this.m._hbe_destroy(this.ctx);
    this.ctx = 0;
  }
}
