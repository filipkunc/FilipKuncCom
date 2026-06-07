// #region gtest-test
#include <gtest/gtest.h>
#include "deflate.hpp"
#include <string>
#include <vector>

using namespace fastdeflate;
static std::vector<uint8_t> bytes(const std::string &s) { return {s.begin(), s.end()}; }

TEST(Deflate, RoundTrips) {
  std::string s;
  for (int i = 0; i < 500; i++) s += "hello miniz ";
  auto in = bytes(s);
  auto packed = deflate(in.data(), in.size(), 6);
  EXPECT_LT(packed.size(), in.size());
  EXPECT_EQ(inflate(packed.data(), packed.size()), in);
}

TEST(Deflate, EmptyInput) {
  auto packed = deflate(nullptr, 0, 6);
  EXPECT_TRUE(inflate(packed.data(), packed.size()).empty());
}

TEST(Deflate, HigherLevelIsNotLarger) {
  std::string s;
  for (int i = 0; i < 2000; i++) s += "abcdefgh";
  auto in = bytes(s);
  EXPECT_LE(deflate(in.data(), in.size(), 9).size(),
            deflate(in.data(), in.size(), 1).size());
}

TEST(Inflate, RejectsGarbage) {
  std::vector<uint8_t> junk = {0xde, 0xad, 0xbe, 0xef, 0x00, 0x11};
  EXPECT_THROW(inflate(junk.data(), junk.size()), std::runtime_error);
}
// #endregion gtest-test
