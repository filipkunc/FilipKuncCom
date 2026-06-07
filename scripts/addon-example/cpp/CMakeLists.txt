cmake_minimum_required(VERSION 3.15)
project(fast_deflate C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# miniz: only the mz_-prefixed API, no global deflate()/inflate() macros
add_compile_definitions(MINIZ_NO_ZLIB_COMPATIBLE_NAMES)

# #region cmake
# Node-API headers come straight from the npm packages, so no node-gyp or cmake-js.
execute_process(COMMAND node -p "require('path').dirname(require.resolve('node-api-headers/include/node_api.h'))"
  OUTPUT_VARIABLE NODE_API_INC OUTPUT_STRIP_TRAILING_WHITESPACE)
execute_process(COMMAND node -p "require('path').dirname(require.resolve('node-addon-api/napi.h'))"
  OUTPUT_VARIABLE NODE_ADDON_API_INC OUTPUT_STRIP_TRAILING_WHITESPACE)

add_library(fast_deflate SHARED binding.cpp deflate.cpp ../vendor/miniz.c)
set_target_properties(fast_deflate PROPERTIES PREFIX "" SUFFIX ".node")
target_include_directories(fast_deflate PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR} ../vendor ${NODE_API_INC} ${NODE_ADDON_API_INC})
target_compile_definitions(fast_deflate PRIVATE NAPI_VERSION=10 NAPI_CPP_EXCEPTIONS)

# Node resolves the addon's symbols at load time, so leave them undefined.
if(APPLE)
  target_link_options(fast_deflate PRIVATE -undefined dynamic_lookup)
endif()
# #endregion cmake

# #region gtest
# Unit-test the pure native core (no Node) with GoogleTest, fetched at configure time.
include(FetchContent)
FetchContent_Declare(googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.15.2.tar.gz)
FetchContent_MakeAvailable(googletest)

enable_testing()
add_executable(deflate_test test/deflate_test.cpp deflate.cpp ../vendor/miniz.c)
target_include_directories(deflate_test PRIVATE ${CMAKE_CURRENT_SOURCE_DIR} ../vendor)
target_link_libraries(deflate_test PRIVATE GTest::gtest_main)

include(GoogleTest)
gtest_discover_tests(deflate_test)
# #endregion gtest
