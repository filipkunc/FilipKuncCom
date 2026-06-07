// Compiled to wasm with emcc. Operates on linear memory: caller mallocs input,
// we malloc output and return its offset plus length via an out-pointer.
#include "miniz.h"
#include <stdlib.h>
#include <stdint.h>

uint8_t *compress(const uint8_t *data, int32_t len, int32_t level, int32_t *out_len) {
  mz_ulong bound = mz_compressBound((mz_ulong) len);
  uint8_t *out = (uint8_t *) malloc(bound);
  if (!out) { *out_len = -1; return 0; }
  if (mz_compress2(out, &bound, data, (mz_ulong) len, level) != MZ_OK) {
    free(out); *out_len = -1; return 0;
  }
  *out_len = (int32_t) bound;
  return out;
}

uint8_t *decompress(const uint8_t *data, int32_t len, int32_t *out_len) {
  size_t cap = (size_t) len * 4 + 64;
  for (;;) {
    uint8_t *out = (uint8_t *) malloc(cap);
    mz_ulong dst = (mz_ulong) cap;
    int32_t rc = mz_uncompress(out, &dst, data, (mz_ulong) len);
    if (rc == MZ_OK) { *out_len = (int32_t) dst; return out; }
    free(out);
    if (rc == MZ_BUF_ERROR) { cap *= 2; continue; }
    *out_len = -1; return 0;
  }
}
