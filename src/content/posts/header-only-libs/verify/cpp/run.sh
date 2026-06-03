#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
clang++ -std=c++23 -O2 -I../../code ../../code/magic_enum_example.cpp ../../code/main.cpp -o "$bin"
"$bin"
rm -f "$bin"
