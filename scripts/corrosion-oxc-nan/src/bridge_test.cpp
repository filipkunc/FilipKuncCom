// #region gtest
// Tests the exact FFI surface the addon uses, without any V8 in the room:
// link liboxc_bridge.a into a plain GoogleTest binary and hit the C ABI.
// Catches linking, ABI, and ownership regressions where they are debuggable.
#include <gtest/gtest.h>

#include <string>

extern "C" {
char* oxc_analyze(const char* source, const char* filename);
void oxc_free_string(char* ptr);
}

namespace {

std::string analyze(const char* source, const char* filename) {
    char* json = oxc_analyze(source, filename);
    std::string result(json);
    oxc_free_string(json);
    return result;
}

TEST(OxcBridge, ParsesTypeScriptByFilename) {
    const std::string report = analyze("const x: number = 1;", "x.ts");
    EXPECT_NE(report.find("\"typescript\":true"), std::string::npos);
    EXPECT_NE(report.find("\"errorCount\":0"), std::string::npos);
}

TEST(OxcBridge, ReportsSyntaxErrors) {
    const std::string report = analyze("const x = ;", "x.js");
    EXPECT_NE(report.find("\"errorCount\":1"), std::string::npos);
    EXPECT_NE(report.find("\"offset\":10"), std::string::npos);
}

TEST(OxcBridge, SurvivesEmptyAndNonUtf8Input) {
    EXPECT_NE(analyze("", "x.js").find("\"errorCount\":0"), std::string::npos);
    EXPECT_NE(analyze("\xff\xfe", "x.js").find("errorCount"), std::string::npos);
}

}  // namespace
// #endregion gtest
