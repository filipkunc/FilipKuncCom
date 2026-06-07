#!/bin/sh
# ava end-to-end over every built addon. Requires the addons built first.
set -e
cd "$(dirname "$0")/../../../../../../scripts/addon-example"
npx ava 2>&1
