/* Thin C shim around HarfBuzz shaping + hb-gpu encoding for the wasm build.
 * JS talks to this through flat int32/byte buffers; no structs cross the
 * boundary. One context = one face + font + reusable draw encoder. */

#include <stdint.h>
#include <stdlib.h>

#include <emscripten/emscripten.h>

#include "hb.h"
#include "hb-gpu.h"
#include "hb-ot.h"

typedef struct {
  hb_face_t *face;
  hb_font_t *font;
  hb_buffer_t *buffer;
  hb_gpu_draw_t *draw;
  int32_t *shape_out;
  unsigned shape_cap; /* capacity in glyphs */
  hb_blob_t *last_blob;
  int32_t extents[4]; /* x_bearing, y_bearing, width, height (font units, Y-up) */
  int32_t font_extents[3]; /* ascender, descender, line_gap */
  hb_position_t lig_carets[15];
} hbe_ctx_t;

EMSCRIPTEN_KEEPALIVE
hbe_ctx_t *hbe_create(const uint8_t *font_data, unsigned len) {
  hb_blob_t *blob = hb_blob_create((const char *)font_data, len,
                                   HB_MEMORY_MODE_DUPLICATE, NULL, NULL);
  hb_face_t *face = hb_face_create(blob, 0);
  hb_blob_destroy(blob);
  if (!hb_face_get_glyph_count(face)) {
    hb_face_destroy(face);
    return NULL;
  }

  hbe_ctx_t *ctx = (hbe_ctx_t *)calloc(1, sizeof(*ctx));
  if (!ctx) {
    hb_face_destroy(face);
    return NULL;
  }
  ctx->face = face;
  ctx->font = hb_font_create(face); /* default scale = upem, i.e. font units */
  ctx->buffer = hb_buffer_create();
  ctx->draw = hb_gpu_draw_create_or_fail();
  if (!ctx->draw) {
    hb_buffer_destroy(ctx->buffer);
    hb_font_destroy(ctx->font);
    hb_face_destroy(ctx->face);
    free(ctx);
    return NULL;
  }
  /* Encode in font units: upem-sized coordinates fit the blob format's
   * +/-8000 quantization range comfortably (see hb-gpu.h). */
  int x_scale, y_scale;
  hb_font_get_scale(ctx->font, &x_scale, &y_scale);
  hb_gpu_draw_set_scale(ctx->draw, x_scale, y_scale);
  return ctx;
}

EMSCRIPTEN_KEEPALIVE
unsigned hbe_upem(const hbe_ctx_t *ctx) { return hb_face_get_upem(ctx->face); }

EMSCRIPTEN_KEEPALIVE
unsigned hbe_glyph_count(const hbe_ctx_t *ctx) {
  return hb_face_get_glyph_count(ctx->face);
}

/* Horizontal-layout vertical metrics: ascender, descender (negative),
 * line_gap, in font units. Returns a pointer to 3 int32s. */
EMSCRIPTEN_KEEPALIVE
const int32_t *hbe_font_extents(hbe_ctx_t *ctx) {
  hb_font_extents_t e;
  hb_font_get_h_extents(ctx->font, &e);
  ctx->font_extents[0] = e.ascender;
  ctx->font_extents[1] = e.descender;
  ctx->font_extents[2] = e.line_gap;
  return ctx->font_extents;
}

/* Shapes UTF-16 text (so cluster values are JS string indices). Returns
 * glyph count; per-glyph data is 6 int32s at hbe_shape_data(): gid, cluster,
 * x_advance, y_advance, x_offset, y_offset (font units). */
EMSCRIPTEN_KEEPALIVE
unsigned hbe_shape(hbe_ctx_t *ctx, const uint16_t *utf16, int len) {
  hb_buffer_clear_contents(ctx->buffer);
  hb_buffer_add_utf16(ctx->buffer, utf16, len, 0, len);
  hb_buffer_guess_segment_properties(ctx->buffer);
  hb_shape(ctx->font, ctx->buffer, NULL, 0);

  unsigned n = hb_buffer_get_length(ctx->buffer);
  if (n > ctx->shape_cap) {
    int32_t *grown = (int32_t *)realloc(ctx->shape_out, n * 6 * sizeof(int32_t));
    if (!grown) return 0;
    ctx->shape_out = grown;
    ctx->shape_cap = n;
  }

  const hb_glyph_info_t *info = hb_buffer_get_glyph_infos(ctx->buffer, NULL);
  const hb_glyph_position_t *pos = hb_buffer_get_glyph_positions(ctx->buffer, NULL);
  for (unsigned i = 0; i < n; i++) {
    int32_t *out = ctx->shape_out + i * 6;
    out[0] = (int32_t)info[i].codepoint;
    out[1] = (int32_t)info[i].cluster;
    out[2] = pos[i].x_advance;
    out[3] = pos[i].y_advance;
    out[4] = pos[i].x_offset;
    out[5] = pos[i].y_offset;
  }
  return n;
}

EMSCRIPTEN_KEEPALIVE
const int32_t *hbe_shape_data(const hbe_ctx_t *ctx) { return ctx->shape_out; }

/* Encodes one glyph outline into hb-gpu texels. Returns byte length of the
 * texel blob (0 = no ink, e.g. space; -1 = failure). Data at hbe_blob_data(),
 * extents at hbe_extents(). Valid until the next encode call. */
// #region encode-glyph
EMSCRIPTEN_KEEPALIVE
int hbe_encode_glyph(hbe_ctx_t *ctx, unsigned gid) {
  hb_gpu_draw_glyph(ctx->draw, ctx->font, gid);

  hb_glyph_extents_t ext = {0, 0, 0, 0};
  hb_blob_t *blob = hb_gpu_draw_encode(ctx->draw, &ext);
  if (!blob) return -1;

  if (ctx->last_blob) hb_gpu_draw_recycle_blob(ctx->draw, ctx->last_blob);
  ctx->last_blob = blob;
  ctx->extents[0] = ext.x_bearing;
  ctx->extents[1] = ext.y_bearing;
  ctx->extents[2] = ext.width;
  ctx->extents[3] = ext.height;

  unsigned blen = 0;
  hb_blob_get_data(blob, &blen);
  return (int)blen;
}

// #endregion encode-glyph

EMSCRIPTEN_KEEPALIVE
const uint8_t *hbe_blob_data(const hbe_ctx_t *ctx) {
  unsigned len = 0;
  return ctx->last_blob ? (const uint8_t *)hb_blob_get_data(ctx->last_blob, &len)
                        : NULL;
}

EMSCRIPTEN_KEEPALIVE
const int32_t *hbe_extents(const hbe_ctx_t *ctx) { return ctx->extents; }

/* GDEF ligature caret positions for a glyph (font units, x direction, LTR).
 * Returns the count (0 = font has no carets for this glyph); values at
 * hbe_lig_carets_data(). */
EMSCRIPTEN_KEEPALIVE
int hbe_lig_carets(hbe_ctx_t *ctx, unsigned gid) {
  unsigned count = 15;
  hb_ot_layout_get_ligature_carets(ctx->font, HB_DIRECTION_LTR, gid, 0,
                                   &count, ctx->lig_carets);
  return (int)count;
}

EMSCRIPTEN_KEEPALIVE
const int32_t *hbe_lig_carets_data(const hbe_ctx_t *ctx) {
  return ctx->lig_carets;
}

/* which: 0 = shared helpers, 1 = draw, 2 = paint.
 * stage/lang: hb_gpu_shader_stage_t / hb_gpu_shader_lang_t values. */
EMSCRIPTEN_KEEPALIVE
const char *hbe_shader_source(int which, int stage, int lang) {
  switch (which) {
    case 0: return hb_gpu_shader_source((hb_gpu_shader_stage_t)stage,
                                        (hb_gpu_shader_lang_t)lang);
    case 1: return hb_gpu_draw_shader_source((hb_gpu_shader_stage_t)stage,
                                             (hb_gpu_shader_lang_t)lang);
    case 2: return hb_gpu_paint_shader_source((hb_gpu_shader_stage_t)stage,
                                              (hb_gpu_shader_lang_t)lang);
  }
  return NULL;
}

EMSCRIPTEN_KEEPALIVE
void hbe_destroy(hbe_ctx_t *ctx) {
  if (!ctx) return;
  if (ctx->last_blob) hb_blob_destroy(ctx->last_blob);
  hb_gpu_draw_destroy(ctx->draw);
  hb_buffer_destroy(ctx->buffer);
  hb_font_destroy(ctx->font);
  hb_face_destroy(ctx->face);
  free(ctx->shape_out);
  free(ctx);
}
