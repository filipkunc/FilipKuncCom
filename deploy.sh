#!/usr/bin/env bash
#
# Deploy <ref> (default: HEAD) to the Hetzner box.
#
# Flow: resolve the ref to a committed git SHA, ship the committed tree over
# SSH, podman-build on the box, retag :latest, and restart the user systemd
# unit. The build artifact is content-addressed by the SHA — same script,
# whether invoked by hand or by CI later.
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

WORK="builds/${SHA}"
echo "==> deploying ${SHA} (ref: ${REF}) to ${DEPLOY_HOST}"

ssh "$DEPLOY_HOST" "mkdir -p '${WORK}'"
git archive --format=tar "$SHA" | ssh "$DEPLOY_HOST" "tar -x -C '${WORK}'"

ssh "$DEPLOY_HOST" bash <<EOSSH
set -euo pipefail
cd '${WORK}'

# Skip build if this SHA's image already exists (rollbacks/retags via deploy).
if podman image exists '${APP}:${SHA}'; then
  echo "==> image ${APP}:${SHA} already present, skipping build"
else
  echo "==> building ${APP}:${SHA} on box"
  podman build --build-arg GIT_SHA='${SHA}' -t '${APP}:${SHA}' .
fi

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
