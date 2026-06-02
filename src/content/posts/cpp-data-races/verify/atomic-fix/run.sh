#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
clang++ -std=c++23 -O2 -pthread -I../../code ../../code/atomic_counter.cpp -o "$bin"
"$bin" right
rm -f "$bin"
