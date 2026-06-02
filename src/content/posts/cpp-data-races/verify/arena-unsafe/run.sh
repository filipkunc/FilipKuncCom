#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
clang++ -std=c++23 -O2 -pthread -I../../code ../../code/arena_race.cpp -o "$bin"
"$bin" unsafe
rm -f "$bin"
