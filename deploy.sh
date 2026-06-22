#!/usr/bin/env bash
#
# Deploy <ref> (default: HEAD) to the Hetzner box.
#
# Usage: ./deploy.sh [--build-only] [<ref>]
#
#   --build-only   Build the image locally from the committed tree and stop,
#                  without touching the box (BUILD_ONLY=1 also works). This
#                  reproduces the real deploy build, including the container's
#                  .dockerignore context, so it catches issues that
#                  `npm run build` cannot (it builds the working tree directly).
#
# Flow: resolve the ref to a committed git SHA, build the image LOCALLY from
# that committed tree, ship it to the box over SSH (podman save | podman load),
# retag :latest, and restart the user systemd unit. The artifact is
# content-addressed by the SHA.
#
# The image is built locally rather than on the box because the box is small
# and the Monaco + TypeScript client bundle needs more memory to build than it
# has. The runtime image is tiny (static site + a builtins-only Node server),
# so the transfer is cheap.
#
# Env:
#   DEPLOY_HOST  ssh target, default deploy@filipkunc.com
#   APP_NAME     image/unit name, default filipkunc-com
#   APP_DOMAIN   public domain used for readiness probe, default filipkunc.com
#   BUILD_ONLY   non-empty is the same as passing --build-only

set -euo pipefail

BUILD_ONLY=${BUILD_ONLY:-}
REF=HEAD
for arg in "$@"; do
  case "$arg" in
    --build-only|-b) BUILD_ONLY=1 ;;
    -*) echo "fatal: unknown option '$arg'" >&2; exit 1 ;;
    *) REF=$arg ;;
  esac
done

DEPLOY_HOST=${DEPLOY_HOST:-deploy@filipkunc.com}
APP=${APP_NAME:-filipkunc-com}
DOMAIN=${APP_DOMAIN:-filipkunc.com}
UNIT="${APP}.service"

cd "$(dirname "$0")"

if ! git rev-parse --verify "$REF^{commit}" >/dev/null 2>&1; then
  echo "fatal: '$REF' is not a known commit" >&2
  exit 1
fi
SHA=$(git rev-parse --short=12 "$REF")

if [[ "$REF" == "HEAD" ]] && ! git diff --quiet HEAD --; then
  echo "warning: working tree has uncommitted changes — deploying committed HEAD ($SHA), not your edits" >&2
fi

# Build the image locally from the committed tree. The image is content-addressed
# by the SHA, so an existing local image was built from this exact tree and is
# safe to reuse.
build_local() {
  if podman image exists "${APP}:${SHA}"; then
    echo "==> local image ${APP}:${SHA} present, reusing"
    return
  fi
  echo "==> building ${APP}:${SHA} locally from the committed tree"
  CTX=$(mktemp -d)
  trap 'rm -rf "$CTX"' EXIT
  git archive --format=tar "$SHA" | tar -x -C "$CTX"
  podman build --build-arg GIT_SHA="$SHA" -t "${APP}:${SHA}" "$CTX"
}

# --build-only: validate the deploy build locally and stop, never touching the box.
if [[ -n "$BUILD_ONLY" ]]; then
  echo "==> build-only: building ${SHA} (ref: ${REF}), will not deploy"
  build_local
  echo "==> build-only: image ${APP}:${SHA} ready, nothing shipped"
  exit 0
fi

echo "==> deploying ${SHA} (ref: ${REF}) to ${DEPLOY_HOST}"

# Skip the whole build + transfer if the box already has this SHA (rollbacks,
# re-runs). Otherwise build locally and ship it.
if ssh "$DEPLOY_HOST" "podman image exists '${APP}:${SHA}'"; then
  echo "==> image ${APP}:${SHA} already on box, skipping build and transfer"
else
  build_local
  echo "==> shipping image to ${DEPLOY_HOST}"
  podman save "${APP}:${SHA}" | gzip | ssh "$DEPLOY_HOST" "gunzip | podman load"
fi

ssh "$DEPLOY_HOST" bash <<EOSSH
set -euo pipefail

podman tag '${APP}:${SHA}' '${APP}:latest'

# Reload in case the Quadlet .container file changed (Ansible owns that file;
# this is defensive). Restart picks up the new :latest image.
systemctl --user daemon-reload
systemctl --user restart '${UNIT}'
EOSSH

echo "==> waiting for ${DOMAIN}/healthz to report ${SHA}"
for i in {1..30}; do
  body=$(curl -fsS --max-time 3 "https://${DOMAIN}/healthz" 2>/dev/null || true)
  if [[ "$body" == *"\"gitSha\":\"${SHA}\""* && "$body" == *"\"status\":\"ready\""* ]]; then
    echo "==> deploy of ${SHA} verified"
    exit 0
  fi
  sleep 1
done

echo "fatal: deploy verification timed out (last body: ${body:-<empty>})" >&2
exit 1
