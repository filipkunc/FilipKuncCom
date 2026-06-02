#!/bin/sh
set -e
cd "$(dirname "$0")"
bin="$(mktemp)"
# Build the same race under ThreadSanitizer, then trim its report to the stable
# parts: the conflicting accesses and the file:line they live on. Addresses,
# pids, thread ids and the deep std::thread backtraces are dropped so the
# captured output does not churn between runs.
clang++ -std=c++23 -fsanitize=thread -O1 -g -pthread -I../../code ../../code/tsan_counter.cpp -o "$bin"
TSAN_OPTIONS="halt_on_error=1 exitcode=0" "$bin" 2>&1 | awk '
  /WARNING: ThreadSanitizer/ { print "WARNING: ThreadSanitizer: data race"; next }
  /Location is global/ { sub(/ at 0x.*/, ""); sub(/^[[:space:]]+/, "  "); print; next }
  /of size [0-9]+ at/ { sub(/ at 0x[0-9a-f]+/, ""); sub(/^[[:space:]]+/, "  "); print; nf=1; next }
  nf && /#0 / { l=$0; sub(/.*\/code\//,"",l); sub(/ \(.*/,"",l); sub(/:[0-9]+$/,"",l); print "    " l; nf=0; next }
  /SUMMARY: ThreadSanitizer/ { l=$0; sub(/.*\/code\//,"",l); sub(/:[0-9]+ in .*/,"",l); print "SUMMARY: ThreadSanitizer: data race in " l; next }
'
rm -f "$bin"
