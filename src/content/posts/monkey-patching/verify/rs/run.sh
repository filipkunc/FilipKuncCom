#!/bin/sh
set -e
cd "$(dirname "$0")"
cargo run --release -- hello.txt
