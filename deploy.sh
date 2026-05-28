#!/usr/bin/env bash
#
# Deploy <ref> (default: HEAD) to the Hetzner box.
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

set -euo pipefail

REF=${1:-HEAD}
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

echo "==> deploying ${SHA} (ref: ${REF}) to ${DEPLOY_HOST}"

# Skip the whole build + transfer if the box already has this SHA (rollbacks,
# re-runs). Otherwise build locally and ship it.
if ssh "$DEPLOY_HOST" "podman image exists '${APP}:${SHA}'"; then
  echo "==> image ${APP}:${SHA} already on box, skipping build and transfer"
else
  if podman image exists "${APP}:${SHA}"; then
    echo "==> local image ${APP}:${SHA} present, reusing"
  else
    echo "==> building ${APP}:${SHA} locally from the committed tree"
    CTX=$(mktemp -d)
    trap 'rm -rf "$CTX"' EXIT
    git archive --format=tar "$SHA" | tar -x -C "$CTX"
    podman build --build-arg GIT_SHA="$SHA" -t "${APP}:${SHA}" "$CTX"
  fi

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
