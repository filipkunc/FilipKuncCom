#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
# -Wno-deprecated-volatile: C++20 deprecates ++ on a volatile, which is itself a
# hint that volatile is the wrong tool here, but the warning would clutter the
# captured run.
clang++ -std=c++23 -O2 -pthread -Wno-deprecated-volatile -I../../code ../../code/volatile_counter.cpp -o "$bin"
"$bin"
rm -f "$bin"
