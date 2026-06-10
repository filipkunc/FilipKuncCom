// WebGL2 renderer for hb-gpu "draw" (monochrome Slug coverage) glyphs.
// Conventions mirror HarfBuzz's own util/gpu demo: texcoords in font units,
// premultiplied-alpha output, per-vertex emPerPos for the dilation Jacobian,
// u_viewport = canvas size in pixels.
import { SHADER, STAGE, LANG } from './hb.mjs';

const ATLAS_WIDTH = 1024; // texels per row; shader addresses linearly via %/

const VERT_MAIN = `
uniform mat4 u_mvp;
uniform vec2 u_viewport;

in vec2 a_position;   // pixels, y-down
in vec2 a_texcoord;   // font units, y-up
in vec2 a_normal;     // outward corner normal, screen space
in float a_emPerPos;  // font units per pixel (upem / fontSizePx)
in uint a_glyphLoc;   // texel offset of the glyph blob in the atlas

out vec2 v_texcoord;
flat out uint v_glyphLoc;

void main () {
  vec2 pos = a_position;
  vec2 tex = a_texcoord;
  vec4 jac = vec4 (a_emPerPos, 0.0, 0.0, -a_emPerPos);
  hb_gpu_dilate (pos, tex, a_normal, jac, u_mvp, u_viewport);
  gl_Position = u_mvp * vec4 (pos, 0.0, 1.0);
  v_texcoord = tex;
  v_glyphLoc = a_glyphLoc;
}
`;

// #region fragment-main
const FRAG_MAIN = `
uniform vec4 u_foreground;     // straight alpha
uniform float u_stem_darkening; // 0 or 1
uniform float u_gamma;
uniform float u_debug;          // 0 or 1: per-pixel curve counts

in vec2 v_texcoord;
flat in uint v_glyphLoc;

out vec4 fragColor;

void main () {
  float cov = hb_gpu_draw (v_texcoord, v_glyphLoc);
  vec4 c = vec4 (u_foreground.rgb * u_foreground.a, u_foreground.a) * cov;

  /* Adjust edge coverage only, like the reference demo. */
  if (cov > 0.0 && cov < 1.0) {
    float adj = cov;
    if (u_stem_darkening > 0.0) {
      float brightness = c.a > 0.0 ? dot (c.rgb, vec3 (1.0 / 3.0)) / c.a : 0.0;
      adj = hb_gpu_stem_darken (adj, brightness, hb_gpu_ppem (v_texcoord, v_glyphLoc));
    }
    if (u_gamma != 1.0)
      adj = pow (adj, u_gamma);
    c *= adj / cov;
  }

  if (u_debug > 0.0) {
    ivec2 counts = _hb_gpu_curve_counts (v_texcoord, v_glyphLoc);
    float r = clamp (float (counts.x) / 8.0, 0.0, 1.0);
    float g = clamp (float (counts.y) / 8.0, 0.0, 1.0);
    fragColor = vec4 (r, g, c.a, max (max (r, g), c.a));
    return;
  }

  fragColor = c;
}
`;
// #endregion fragment-main

const RECT_VERT = `#version 300 es
precision highp float;
uniform mat4 u_mvp;
in vec2 a_position;
void main () { gl_Position = u_mvp * vec4 (a_position, 0.0, 1.0); }
`;

const RECT_FRAG = `#version 300 es
precision highp float;
uniform vec4 u_color; // premultiplied
out vec4 fragColor;
void main () { fragColor = u_color; }
`;

function compile(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    throw new Error(`shader compile failed:\n${log}`);
  }
  return sh;
}

function link(gl, vertSrc, fragSrc) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

export function createTextRenderer(gl, hb, font) {
  const vertSrc =
    '#version 300 es\nprecision highp float;\n' +
    hb.shaderSource(SHADER.SHARED, STAGE.VERTEX, LANG.GLSL) +
    VERT_MAIN;
  const fragSrc =
    '#version 300 es\nprecision highp float;\nprecision highp int;\n' +
    '#define HB_GPU_ATLAS_2D\n' +
    hb.shaderSource(SHADER.SHARED, STAGE.FRAGMENT, LANG.GLSL) +
    hb.shaderSource(SHADER.DRAW, STAGE.FRAGMENT, LANG.GLSL) +
    FRAG_MAIN;

  const program = link(gl, vertSrc, fragSrc);
  const rectProgram = link(gl, RECT_VERT, RECT_FRAG);
  const uRect = {
    mvp: gl.getUniformLocation(rectProgram, 'u_mvp'),
    color: gl.getUniformLocation(rectProgram, 'u_color'),
  };

  const uni = (name) => gl.getUniformLocation(program, name);
  const u = {
    mvp: uni('u_mvp'),
    viewport: uni('u_viewport'),
    foreground: uni('u_foreground'),
    stemDarkening: uni('u_stem_darkening'),
    gamma: uni('u_gamma'),
    debug: uni('u_debug'),
    atlas: uni('hb_gpu_atlas'),
    atlasWidth: uni('hb_gpu_atlas_width'),
  };

  // Glyph atlas: blobs concatenated linearly in an RGBA16I 2D texture.
  const glyphCache = new Map(); // gid -> {loc, extents} | null (no ink)
  let atlasData = new Int16Array(ATLAS_WIDTH * 4 * 64);
  let atlasTexels = 0;
  let atlasDirty = false;
  const atlasTex = gl.createTexture();

  function ensureGlyph(gid) {
    let entry = glyphCache.get(gid);
    if (entry !== undefined) return entry;
    const enc = font.encodeGlyph(gid);
    if (!enc) {
      glyphCache.set(gid, null);
      return null;
    }
    const texels = enc.texels.byteLength / 8;
    const needed = (atlasTexels + texels) * 4;
    if (needed > atlasData.length) {
      const grown = new Int16Array(Math.max(needed, atlasData.length * 2));
      grown.set(atlasData);
      atlasData = grown;
    }
    atlasData.set(
      new Int16Array(enc.texels.buffer, enc.texels.byteOffset, texels * 4),
      atlasTexels * 4,
    );
    entry = { loc: atlasTexels, extents: enc.extents };
    atlasTexels += texels;
    atlasDirty = true;
    glyphCache.set(gid, entry);
    return entry;
  }

  function uploadAtlas() {
    const height = Math.max(1, Math.ceil(atlasTexels / ATLAS_WIDTH));
    const padded = new Int16Array(ATLAS_WIDTH * height * 4);
    padded.set(atlasData.subarray(0, atlasTexels * 4));
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16I, ATLAS_WIDTH, height, 0,
                  gl.RGBA_INTEGER, gl.SHORT, padded);
    atlasDirty = false;
  }

  // Vertex layout: pos(2f) tex(2f) normal(2f) emPerPos(1f) glyphLoc(1u) = 32 B.
  const STRIDE = 32;
  const vao = gl.createVertexArray();
  const vbo = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  const attr = (name) => gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(attr('a_position'));
  gl.vertexAttribPointer(attr('a_position'), 2, gl.FLOAT, false, STRIDE, 0);
  gl.enableVertexAttribArray(attr('a_texcoord'));
  gl.vertexAttribPointer(attr('a_texcoord'), 2, gl.FLOAT, false, STRIDE, 8);
  gl.enableVertexAttribArray(attr('a_normal'));
  gl.vertexAttribPointer(attr('a_normal'), 2, gl.FLOAT, false, STRIDE, 16);
  gl.enableVertexAttribArray(attr('a_emPerPos'));
  gl.vertexAttribPointer(attr('a_emPerPos'), 1, gl.FLOAT, false, STRIDE, 24);
  gl.enableVertexAttribArray(attr('a_glyphLoc'));
  gl.vertexAttribIPointer(attr('a_glyphLoc'), 1, gl.UNSIGNED_INT, STRIDE, 28);
  gl.bindVertexArray(null);

  // Rect pipeline (selection highlight, caret).
  const rectVao = gl.createVertexArray();
  const rectVbo = gl.createBuffer();
  gl.bindVertexArray(rectVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, rectVbo);
  const rectPosLoc = gl.getAttribLocation(rectProgram, 'a_position');
  gl.enableVertexAttribArray(rectPosLoc);
  gl.vertexAttribPointer(rectPosLoc, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);

  let vertexCount = 0;

  function mvp() {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    // Pixel (y-down) to clip space, column-major.
    return [2 / w, 0, 0, 0, 0, -2 / h, 0, 0, 0, 0, 1, 0, -1, 1, 0, 1];
  }

  // Persistent vertex scratch: setRuns runs per frame in animation/bench
  // paths, and per-frame ArrayBuffer + quad-object allocation caused GC
  // pauses (worst frames at exactly 2x vsync under load).
  let scratch = new ArrayBuffer(64 * 1024);
  let scratchF32 = new Float32Array(scratch);
  let scratchU32 = new Uint32Array(scratch);

  function ensureScratch(bytes) {
    if (scratch.byteLength < bytes) {
      let size = scratch.byteLength;
      while (size < bytes) size *= 2;
      scratch = new ArrayBuffer(size);
      scratchF32 = new Float32Array(scratch);
      scratchU32 = new Uint32Array(scratch);
    }
  }

  /**
   * Lays out runs of shaped glyphs. Each run: {shaped, x, y, sizePx} with the
   * baseline-left pen at (x, y) in pixel coordinates (y down).
   * Allocation-free per frame (persistent scratch buffer).
   */
  function setRuns(runs) {
    const upem = font.upem;
    let maxGlyphs = 0;
    for (const run of runs) maxGlyphs += run.shaped.length;
    ensureScratch(maxGlyphs * 6 * STRIDE);
    const f32 = scratchF32;
    const u32 = scratchU32;

    let vi = 0;
    for (const run of runs) {
      const scale = run.sizePx / upem; // pixels per font unit
      const emPerPos = 1 / scale;
      let penX = run.x;
      for (const g of run.shaped) {
        const entry = ensureGlyph(g.gid);
        if (entry) {
          const e = entry.extents;
          const loc = entry.loc;
          const ox = penX + g.xOffset * scale;
          const oy = run.y - g.yOffset * scale;
          // Font units, y-up: left/right, top = yBearing, bottom = top + height (height < 0).
          const x0 = e.xBearing;
          const x1 = e.xBearing + e.width;
          const yT = e.yBearing;
          const yB = e.yBearing + e.height;
          // Corners: (cx, cy) in {0,1}; same triangle order as before.
          for (let c = 0; c < 6; c++) {
            const cx = (c === 1 || c === 3 || c === 5) ? 1 : 0;
            const cy = (c === 2 || c === 4 || c === 5) ? 1 : 0;
            const ex = cx ? x1 : x0;
            const ey = cy ? yT : yB;
            const o = vi * 8;
            f32[o] = ox + scale * ex;
            f32[o + 1] = oy - scale * ey; // screen y-down
            f32[o + 2] = ex;
            f32[o + 3] = ey;
            f32[o + 4] = cx ? 1 : -1;
            f32[o + 5] = cy ? -1 : 1; // top corner points up on screen
            f32[o + 6] = emPerPos;
            u32[o + 7] = loc;
            vi++;
          }
        }
        penX += g.xAdvance * scale;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scratch, 0, vi * 8), gl.DYNAMIC_DRAW);
    vertexCount = vi;
  }

  /** Single-run convenience; returns the advance width in pixels. */
  function setText(shaped, { x = 0, y = 0, sizePx = 16 } = {}) {
    setRuns([{ shaped, x, y, sizePx }]);
    const scale = sizePx / font.upem;
    return shaped.reduce((s, g) => s + g.xAdvance, 0) * scale;
  }

  function beginFrame(background = [1, 1, 1, 1]) {
    if (atlasDirty) uploadAtlas();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(...background);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied throughout
  }

  function drawText({
    foreground = [0, 0, 0, 1],
    stemDarkening = true,
    gamma = 1,
    debug = false,
  } = {}) {
    if (!vertexCount) return;
    gl.useProgram(program);
    gl.uniformMatrix4fv(u.mvp, false, mvp());
    gl.uniform2f(u.viewport, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform4fv(u.foreground, foreground);
    gl.uniform1f(u.stemDarkening, stemDarkening ? 1 : 0);
    gl.uniform1f(u.gamma, gamma);
    gl.uniform1f(u.debug, debug ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.uniform1i(u.atlas, 0);
    gl.uniform1i(u.atlasWidth, ATLAS_WIDTH);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    gl.bindVertexArray(null);
  }

  /**
   * Redraws the current text buffer clipped to a rect (pixels, y-down).
   * Used for selection: same glyphs, different color, scissored — a ligature
   * glyph straddling the selection edge renders two-tone correctly because
   * the SAME glyph is drawn twice and clipped, with shaping untouched.
   */
  function drawTextClipped(rect, opts) {
    const h = gl.drawingBufferHeight;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(
      Math.round(rect.x),
      Math.round(h - rect.y - rect.h),
      Math.max(0, Math.round(rect.w)),
      Math.max(0, Math.round(rect.h)),
    );
    drawText(opts);
    gl.disable(gl.SCISSOR_TEST);
  }

  /** Draws solid rects [{x, y, w, h}] (pixels, y-down) in a straight-alpha color. */
  function drawRects(rects, color) {
    if (!rects.length) return;
    const f32 = new Float32Array(rects.length * 12);
    let o = 0;
    for (const r of rects) {
      const x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
      f32.set([x0, y0, x1, y0, x0, y1, x1, y0, x0, y1, x1, y1], o);
      o += 12;
    }
    gl.useProgram(rectProgram);
    gl.uniformMatrix4fv(uRect.mvp, false, mvp());
    const a = color[3];
    gl.uniform4f(uRect.color, color[0] * a, color[1] * a, color[2] * a, a);
    gl.bindVertexArray(rectVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, rectVbo);
    gl.bufferData(gl.ARRAY_BUFFER, f32, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, rects.length * 6);
    gl.bindVertexArray(null);
  }

  /** Convenience: clear + draw the current text buffer. */
  function render(opts = {}) {
    beginFrame(opts.background ?? [1, 1, 1, 1]);
    drawText(opts);
  }

  /** Raw RGBA framebuffer readback (call right after drawing), for tests. */
  function readPixels() {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const data = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return { data, w, h };
  }

  /** Coverage stats over the whole framebuffer, for tests. */
  function readStats() {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let inked = 0;
    let partial = 0;
    for (let i = 0; i < px.length; i += 4) {
      const v = px[i]; // red channel; black-on-white text
      if (v < 248) inked++;
      if (v > 8 && v < 248) partial++;
    }
    return { inked, partial, total: w * h };
  }

  return {
    setRuns, setText, beginFrame, drawText, drawTextClipped, drawRects, render,
    readStats, readPixels, ensureGlyph,
    get atlasTexels() { return atlasTexels; },
  };
}
