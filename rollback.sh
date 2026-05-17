#!/usr/bin/env bash
#
# Rollback to a previously-built image already on the box. No build runs.
# Usage: ./rollback.sh <short-sha>
#
# Env mirrors deploy.sh.

set -euo pipefail

SHA=${1:?usage: rollback.sh <short-sha>}
DEPLOY_HOST=${DEPLOY_HOST:-deploy@filipkunc.com}
APP=${APP_NAME:-filipkunc-com}
DOMAIN=${APP_DOMAIN:-filipkunc.com}
UNIT="${APP}.service"

echo "==> rolling back ${DOMAIN} to ${SHA} on ${DEPLOY_HOST}"

ssh "$DEPLOY_HOST" bash <<EOSSH
set -euo pipefail
if ! podman image exists '${APP}:${SHA}'; then
  echo "fatal: image ${APP}:${SHA} not present on box" >&2
  echo "available tags:" >&2
  podman images --format '  {{.Repository}}:{{.Tag}}' | grep '^  ${APP}:' >&2 || true
  exit 1
fi
podman tag '${APP}:${SHA}' '${APP}:latest'
systemctl --user restart '${UNIT}'
EOSSH

echo "==> waiting for ${DOMAIN}/healthz to report ${SHA}"
for i in {1..30}; do
  body=$(curl -fsS --max-time 3 "https://${DOMAIN}/healthz" 2>/dev/null || true)
  if [[ "$body" == *"\"gitSha\":\"${SHA}\""* && "$body" == *"\"status\":\"ready\""* ]]; then
    echo "==> rollback to ${SHA} verified"
    exit 0
  fi
  sleep 1
done

echo "fatal: rollback verification timed out (last body: ${body:-<empty>})" >&2
exit 1
