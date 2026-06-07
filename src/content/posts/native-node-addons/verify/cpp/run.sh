#!/bin/sh
# GoogleTest on the pure C++ core. Requires `npm run build:cpp` first.
set -e
cd "$(dirname "$0")/../../../../../../scripts/addon-example"
./cpp/build/deflate_test
