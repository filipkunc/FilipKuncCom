#!/bin/sh
set -e
cd "$(dirname "$0")"
# Node 24 strips TypeScript types natively, so the real .ts modules run as-is.
node run.ts
