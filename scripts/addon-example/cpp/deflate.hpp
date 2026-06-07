#pragma once
#include <cstdint>
#include <vector>
#include <string>
#include <stdexcept>

// Pure native logic, no Node here, so it can be unit-tested with GoogleTest.
namespace fastdeflate {
std::vector<uint8_t> deflate(const uint8_t *data, size_t len, int32_t level);
std::vector<uint8_t> inflate(const uint8_t *data, size_t len);
}  // namespace fastdeflate
