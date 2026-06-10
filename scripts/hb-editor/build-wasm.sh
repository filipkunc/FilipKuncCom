#!/bin/bash
# Builds dist/hb-gpu.mjs + dist/hb-gpu.wasm: HarfBuzz core (amalgam) +
# libharfbuzz-gpu sources + src/shim.c, compiled with Emscripten.
# Also fetches the test font into fonts/ if missing.
set -euo pipefail

HB_VERSION=14.2.1
DIR="$(cd "$(dirname "$0")" && pwd)"
CACHE="${HB_SRC_CACHE:-$HOME/.cache/hb-src}"
HB="$CACHE/harfbuzz-$HB_VERSION"

if [ ! -d "$HB" ]; then
  mkdir -p "$CACHE"
  echo "Fetching harfbuzz $HB_VERSION..."
  curl -sL "https://github.com/harfbuzz/harfbuzz/releases/download/$HB_VERSION/harfbuzz-$HB_VERSION.tar.xz" \
    | tar xJ -C "$CACHE"
fi

FONT="$DIR/fonts/Inter.ttf"
if [ ! -f "$FONT" ]; then
  mkdir -p "$DIR/fonts"
  echo "Fetching Inter (OFL)..."
  curl -sL -o "$FONT" \
    "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf"
fi

# EB Garamond ligates fi/fl by default (Inter deliberately has no f-ligatures),
# used to exercise ligature caret/selection handling.
GARAMOND="$DIR/fonts/EBGaramond.ttf"
if [ ! -f "$GARAMOND" ]; then
  echo "Fetching EB Garamond (OFL)..."
  curl -sL -o "$GARAMOND" \
    "https://raw.githubusercontent.com/google/fonts/main/ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf"
fi

# Fira Code implements programming ligatures per-character (clusters never
# merge), the caret-safe alternative worth contrasting in the editor demo.
FIRACODE="$DIR/fonts/FiraCode.ttf"
if [ ! -f "$FIRACODE" ]; then
  echo "Fetching Fira Code (OFL)..."
  curl -sL -o "$FIRACODE" \
    "https://raw.githubusercontent.com/google/fonts/main/ofl/firacode/FiraCode%5Bwght%5D.ttf"
fi

if ! command -v emcc >/dev/null 2>&1; then
  source "$HOME/emsdk/emsdk_env.sh" >/dev/null 2>&1
fi

mkdir -p "$DIR/dist"
emcc -Oz -DNDEBUG -DHB_NO_MT \
  -fno-exceptions -fno-rtti \
  -I"$HB/src" \
  "$DIR/src/shim.c" \
  "$HB/src/harfbuzz.cc" \
  "$HB/src/hb-gpu.cc" \
  "$HB/src/hb-gpu-draw.cc" \
  "$HB/src/hb-gpu-paint.cc" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createHbGpuModule \
  -sENVIRONMENT=web,node \
  -sALLOW_MEMORY_GROWTH=1 \
  -sFILESYSTEM=0 \
  -sEXPORTED_FUNCTIONS=_malloc,_free \
  -sEXPORTED_RUNTIME_METHODS=HEAPU8,HEAPU16,HEAP32,UTF8ToString \
  -o "$DIR/dist/hb-gpu.mjs"

ls -la "$DIR/dist"
