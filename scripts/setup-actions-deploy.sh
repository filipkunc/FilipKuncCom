#!/usr/bin/env bash
#
# One-time setup for the GitHub Actions deploy (.github/workflows/deploy.yml).
# Run from a machine that already has SSH access to the box (the laptop key).
#
# Does four things:
#   1. Generates a dedicated ed25519 keypair for Actions (no passphrase).
#   2. Authorizes its public key for the deploy user on the box.
#   3. Captures the box's SSH host keys (ssh-keyscan).
#   4. Uploads DEPLOY_SSH_KEY and DEPLOY_KNOWN_HOSTS as repository secrets via
#      `gh`, or prints where to paste them if `gh` isn't installed.
#
# Idempotent: reuses an existing keypair and re-authorizing/re-setting is safe.
#
# Env mirrors deploy.sh:
#   DEPLOY_HOST  ssh target, default deploy@filipkunc.com

set -euo pipefail

DEPLOY_HOST=${DEPLOY_HOST:-deploy@filipkunc.com}
HOST=${DEPLOY_HOST#*@}
KEY=~/.ssh/filipkunc-com-actions

if [[ -f "$KEY" ]]; then
  echo "==> reusing existing key $KEY"
else
  echo "==> generating dedicated Actions deploy key $KEY"
  ssh-keygen -t ed25519 -N '' -C 'github-actions deploy filipkunc.com' -f "$KEY"
fi

echo "==> authorizing the public key for ${DEPLOY_HOST}"
ssh "$DEPLOY_HOST" bash <<EOSSH
set -euo pipefail
mkdir -p ~/.ssh && chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
grep -qxF '$(cat "$KEY.pub")' ~/.ssh/authorized_keys \
  || echo '$(cat "$KEY.pub")' >> ~/.ssh/authorized_keys
EOSSH

echo "==> scanning ${HOST} host keys"
KNOWN_HOSTS=$(ssh-keyscan "$HOST" 2>/dev/null)
[[ -n "$KNOWN_HOSTS" ]] || { echo "fatal: ssh-keyscan ${HOST} returned nothing" >&2; exit 1; }

if command -v gh >/dev/null; then
  echo "==> setting repository secrets via gh"
  gh secret set DEPLOY_SSH_KEY < "$KEY"
  gh secret set DEPLOY_KNOWN_HOSTS <<<"$KNOWN_HOSTS"
  echo "==> done — pushes to main now deploy via GitHub Actions"
else
  echo
  echo "gh not found — add these two secrets by hand"
  echo "(repo → Settings → Secrets and variables → Actions):"
  echo
  echo "DEPLOY_SSH_KEY: contents of $KEY"
  echo
  echo "DEPLOY_KNOWN_HOSTS:"
  echo "$KNOWN_HOSTS"
fi
