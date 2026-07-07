# One build, two compilers: CMake drives clang/gcc for the C++ addon and,
# through Corrosion, cargo for the Rust crate. Plain CMake, no cmake-js:
# NaN needs the full node.h/v8.h headers, and a Node installed via nvm (or the
# official tarball) ships them next to the binary, so we just ask node.
cmake_minimum_required(VERSION 3.22)
project(corrosion_oxc_nan LANGUAGES CXX)

# --- 1. Corrosion: teach CMake to build cargo crates -------------------------
# #region corrosion
include(FetchContent)
FetchContent_Declare(
    Corrosion
    GIT_REPOSITORY https://github.com/corrosion-rs/corrosion.git
    GIT_TAG v0.6.1
)
FetchContent_MakeAvailable(Corrosion)

# Reads rust/Cargo.toml and creates one CMake target per crate.
# Our crate is named `oxc_bridge`, so this defines a target `oxc_bridge`
# that (a) runs `cargo build` at build time, (b) exposes the produced
# staticlib plus the native libraries Rust's runtime needs (pthread, dl, ...),
# which Corrosion asks cargo for instead of hardcoding.
corrosion_import_crate(MANIFEST_PATH rust/Cargo.toml)
# #endregion corrosion

# --- 2. Node headers: resolved from the running node, no node-gyp/cmake-js ---
# #region node-headers
execute_process(
    COMMAND node -p "require('path').join(require('path').dirname(process.execPath), '..', 'include', 'node')"
    OUTPUT_VARIABLE NODE_INC OUTPUT_STRIP_TRAILING_WHITESPACE
    COMMAND_ERROR_IS_FATAL ANY
)
if(NOT EXISTS ${NODE_INC}/node.h)
    message(FATAL_ERROR "Node headers not found at ${NODE_INC} (nvm/tarball installs ship them; a distro node may need a -devel package)")
endif()
# #endregion node-headers

# --- 3. The Node addon: a plain shared library named *.node ------------------
# #region addon
add_library(addon SHARED src/addon.cpp)

set_target_properties(addon PROPERTIES
    PREFIX ""            # no "lib" prefix
    SUFFIX ".node"       # Node's require() only loads this extension
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
)

target_include_directories(addon PRIVATE
    ${NODE_INC}                              # node.h, v8.h
    ${CMAKE_SOURCE_DIR}/node_modules/nan     # nan.h
)

# The payoff line: the Rust crate is linked like any other CMake target.
target_link_libraries(addon PRIVATE oxc_bridge)

# The addon references Node/V8 symbols that only exist inside the node binary;
# they resolve when node dlopen()s the addon. Linux linkers allow undefined
# symbols in shared libs by default, macOS needs to be told. (Windows needs an
# import library instead; that is the one thing cmake-js/node-gyp would buy us.)
if(APPLE)
    target_link_options(addon PRIVATE -undefined dynamic_lookup)
endif()
# #endregion addon

# --- 4. Tests: all three layers appear in one ctest run / Test Explorer ------
# #region tests
# The C++ test links the Rust staticlib directly: the FFI boundary gets
# exercised in a plain binary, no V8 required. GoogleTest via FetchContent.
FetchContent_Declare(
    googletest
    URL https://github.com/google/googletest/archive/refs/tags/v1.15.2.tar.gz
)
FetchContent_MakeAvailable(googletest)

enable_testing()
add_executable(bridge_test src/bridge_test.cpp)
target_link_libraries(bridge_test PRIVATE oxc_bridge GTest::gtest_main)
include(GoogleTest)
gtest_discover_tests(bridge_test)

# Bridge `cargo test` into CTest so the Rust unit tests show up in the same
# Test Explorer tree as the C++ ones (CMake Tools runs ctest).
find_program(CARGO cargo REQUIRED)
add_test(
    NAME rust.oxc_bridge
    COMMAND ${CMAKE_COMMAND} -E env CARGO_TARGET_DIR=${CMAKE_BINARY_DIR}/cargo-test
            ${CARGO} test --manifest-path ${CMAKE_SOURCE_DIR}/rust/Cargo.toml
)
# #endregion tests
