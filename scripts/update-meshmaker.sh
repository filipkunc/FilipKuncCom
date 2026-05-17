#!/usr/bin/env bash
#
# Build MeshMakerWeb and sync its dist/ into FilipKuncCom/public/meshmaker/
# so the Astro build picks it up and serves it at filipkunc.com/meshmaker/.
#
# Usage: ./scripts/update-meshmaker.sh
#
# Env:
#   MESHMAKER_WEB    path to the MeshMakerWeb project
#                    (default: $HOME/Projects/MeshMaker/MeshMakerWeb)

set -euo pipefail

cd "$(dirname "$0")/.."   # FilipKuncCom repo root
REPO_ROOT=$(pwd)

SRC=${MESHMAKER_WEB:-$HOME/Projects/MeshMaker/MeshMakerWeb}
DEST="$REPO_ROOT/public/meshmaker"

if [[ ! -d "$SRC" ]]; then
  echo "fatal: MeshMakerWeb not found at $SRC (set MESHMAKER_WEB to override)" >&2
  exit 1
fi

echo "==> Building MeshMakerWeb (base=/meshmaker/)"
cd "$SRC"

# Install deps if package-lock changed or node_modules missing.
if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules ]]; then
  echo "==> npm ci (deps stale or missing)"
  npm ci --no-audit --no-fund
fi

# vite build directly (skip MeshMakerWeb's own `tsc -b` step — its type-checking
# is that project's concern; this script's job is just to produce the artifacts).
npx vite build --base=/meshmaker/

if [[ ! -f dist/index.html ]]; then
  echo "fatal: build did not produce dist/index.html" >&2
  exit 1
fi

# ----- TEMPORARY WORKAROUND -------------------------------------------------
# MeshMakerWeb hardcodes absolute paths for its WASM loader and toolbar icons
# as string literals in .tsx, which Vite's `base` does NOT rewrite (it only
# rewrites paths that go through Vite's asset pipeline). Fix those literals
# in the built JS so they resolve under /meshmaker/.
#
# The proper fix is in MeshMakerWeb itself:
#   - hooks/useMeshMaker.ts: use import.meta.env.BASE_URL + 'wasm/...'
#   - components/Toolbar.tsx (or wherever): same for /icons/...
# Once that's done, this sed block can be removed.
# ----------------------------------------------------------------------------
for f in dist/assets/index-*.js; do
  [[ -f "$f" ]] || continue
  # Patterns are specific enough that quote-style doesn't matter (matches inside
  # ", ', and `template` literals). vite build runs from scratch each invocation,
  # so we never double-prefix.
  sed -i \
    -e 's|/wasm/MeshMakerWebGL2|/meshmaker/wasm/MeshMakerWebGL2|g' \
    -e 's|/icons/\([A-Za-z][A-Za-z0-9]*\.png\)|/meshmaker/icons/\1|g' \
    "$f"
done

echo "==> Syncing $SRC/dist/ -> $DEST/"
mkdir -p "$DEST"
rsync -a --delete dist/ "$DEST/"

# Strip the Cloudflare/Netlify _headers file — it's not used by our Node+Caddy
# stack, just clutter at /meshmaker/_headers if someone fetches it.
rm -f "$DEST/_headers"

cd "$REPO_ROOT"
echo "==> Done. Files in public/meshmaker:"
find public/meshmaker -type f | sort | head -20
echo "    ($(find public/meshmaker -type f | wc -l) files total, $(du -sh public/meshmaker | cut -f1))"

echo
echo "Now: review the diff and commit the change to FilipKuncCom."
echo "    git add public/meshmaker && git commit -m 'Update MeshMaker build'"
