#!/bin/bash
# Serve the audition lab at http://localhost:4322/scripts/strudel-lab/
set -euo pipefail
cd "$(dirname "$0")/../.."
echo "open http://localhost:4322/scripts/strudel-lab/"
exec python3 -m http.server 4322
