#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
clang++ -std=c++23 -O2 -pthread -I../../code ../../code/condvar.cpp -o "$bin"
"$bin" wrong
rm -f "$bin"
