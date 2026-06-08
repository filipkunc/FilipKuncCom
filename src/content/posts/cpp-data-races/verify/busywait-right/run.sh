#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
# The same busy-wait with release/acquire. ThreadSanitizer prints nothing because
# the store now synchronizes with the load, so report that it ran clean.
clang++ -std=c++23 -fsanitize=thread -O1 -g -pthread -I../../code ../../code/busywait.cpp -o "$bin"
out="$(TSAN_OPTIONS="exitcode=0" "$bin" right 2>&1)"
echo "$out"
echo "$out" | grep -q 'ThreadSanitizer' || echo "(ThreadSanitizer: no data race)"
rm -f "$bin"
