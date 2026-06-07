#include "deflate.hpp"
#include "miniz.h"

namespace fastdeflate {

std::vector<uint8_t> deflate(const uint8_t *data, size_t len, int32_t level) {
  mz_ulong bound = mz_compressBound(static_cast<mz_ulong>(len));
  std::vector<uint8_t> out(bound);
  int32_t rc = mz_compress2(out.data(), &bound, data, static_cast<mz_ulong>(len), level);
  if (rc != MZ_OK) throw std::runtime_error(std::string("deflate failed: ") + mz_error(rc));
  out.resize(bound);
  return out;
}

std::vector<uint8_t> inflate(const uint8_t *data, size_t len) {
  std::vector<uint8_t> out(len * 4 + 64);
  for (;;) {
    mz_ulong dst = static_cast<mz_ulong>(out.size());
    int32_t rc = mz_uncompress(out.data(), &dst, data, static_cast<mz_ulong>(len));
    if (rc == MZ_OK) { out.resize(dst); return out; }
    if (rc == MZ_BUF_ERROR) { out.resize(out.size() * 2); continue; }
    throw std::runtime_error(std::string("inflate failed: ") + mz_error(rc));
  }
}

}  // namespace fastdeflate
