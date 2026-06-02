#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
clang++ -std=c++23 -O2 -pthread -I../../code ../../code/deadlock.cpp -o "$bin"
"$bin" scoped
rm -f "$bin"
