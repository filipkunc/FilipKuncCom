#!/usr/bin/env bash
#
# Build the production image with podman and run it locally for smoke-testing
# before `./deploy.sh`. Mirrors how the image runs on the box (rootless,
# port 8080 inside, PORT/GIT_SHA env wiring).
#
# Usage:
#   ./run-local.sh              # build + run + smoke + tail logs (Ctrl-C to stop)
#   ./run-local.sh --no-build   # reuse existing :local image
#   ./run-local.sh --port 9090  # bind a different host port (default 8081)
#   ./run-local.sh --no-tail    # build + run + smoke, then exit (container kept)
#
# On Ctrl-C / error, the container is stopped and removed.

set -euo pipefail

cd "$(dirname "$0")"

APP=${APP_NAME:-filipkunc-com}
TAG=local
HOST_PORT=8081
DO_BUILD=1
DO_TAIL=1

while (($#)); do
  case "$1" in
    --no-build) DO_BUILD=0 ;;
    --no-tail)  DO_TAIL=0 ;;
    --port)     shift; HOST_PORT="$1" ;;
    -h|--help)  sed -n '1,16p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

CONTAINER="${APP}-local"
SHA=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)

cleanup() { podman rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
# Only auto-clean when tailing — `--no-tail` intentionally leaves the container.
if [[ $DO_TAIL -eq 1 ]]; then
  trap cleanup EXIT INT TERM
fi

if [[ $DO_BUILD -eq 1 ]]; then
  echo "==> building ${APP}:${TAG} (GIT_SHA=${SHA})"
  podman build --build-arg GIT_SHA="$SHA" -t "${APP}:${TAG}" .
fi

podman rm -f "$CONTAINER" >/dev/null 2>&1 || true

echo "==> starting ${CONTAINER} on http://127.0.0.1:${HOST_PORT}"
podman run -d --name "$CONTAINER" -p "${HOST_PORT}:8080" \
  -e GIT_SHA="$SHA" "${APP}:${TAG}" >/dev/null

# Wait for the listening event in logs (up to ~5s).
for _ in $(seq 1 50); do
  podman logs "$CONTAINER" 2>&1 | grep -q '"event":"listening"' && break
  sleep 0.1
done

echo "==> smoke-testing"
fail=0
for p in / /posts /space-warrior /meshmaker /sitemap-index.xml /favicon.ico /robots.txt /llms.txt; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${HOST_PORT}${p}")
  printf '  %-25s %s\n' "$p" "$code"
  [[ "$code" == 200 ]] || fail=1
done

if [[ $fail -ne 0 ]]; then
  echo "==> smoke failures above" >&2
  echo "==> logs:" >&2
  podman logs "$CONTAINER" >&2
  exit 1
fi

if [[ $DO_TAIL -eq 1 ]]; then
  echo "==> OK — tailing logs (Ctrl-C to stop and remove the container)"
  podman logs -f "$CONTAINER"
else
  echo "==> OK — container left running as ${CONTAINER} on :${HOST_PORT}"
  echo "    podman logs -f ${CONTAINER}"
  echo "    podman rm -f  ${CONTAINER}"
fi
