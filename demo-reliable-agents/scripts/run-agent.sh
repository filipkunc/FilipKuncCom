#!/usr/bin/env bash
# Drive Claude Code headlessly to add the endpoint once, in an isolated
# workspace, and capture the transcript. Never mutates the repo root.
#
# Usage: scripts/run-agent.sh [model] [mcp|no-mcp]
#   mcp (default): workspace gets the skill + MCP + CLAUDE.md
#   no-mcp:        workspace gets none of them, as the control
set -euo pipefail
cd "$(dirname "$0")/.."

MODEL="${1:-claude-sonnet-4-6}"
MODE="${2:-mcp}"

# Bill the subscription, not the metered API. Refuse to run if a key is set.
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "ANTHROPIC_API_KEY is set. Unset it so this runs on your subscription." >&2
  exit 1
fi

mkdir -p runs
OUT="runs/${MODEL}-${MODE}-once.jsonl"

# Pristine workspace OUTSIDE the repo, so a wandering agent has no canonical copy
# to escape to. src/ and test/ are the mutable surface, node_modules is shared by
# symlink, scaffold files are copied only for the mcp arm.
WORK="$(mktemp -d "${TMPDIR:-/tmp}/reliable-agents-once-XXXXXX")"
cp -r src test package.json eslint.config.js "$WORK"/
ln -s "$(pwd)/node_modules" "$WORK/node_modules"

if [[ "$MODE" == "mcp" ]]; then
  cp -r .claude .mcp.json CLAUDE.md mcp "$WORK"/
fi
TASK='Implement ticket NOTES-4567: add a summary endpoint for notes.'

echo "model=$MODEL mode=$MODE dir=$WORK -> $OUT" >&2
( cd "$WORK" && claude -p "$TASK" \
    --model "$MODEL" \
    --permission-mode dontAsk \
    --allowedTools "Read,Edit,Write,Bash(npm run verify),mcp__notes-spec__get_spec,mcp__notes-spec__summarize" \
    --output-format stream-json --verbose ) > "$OUT"

if ( cd "$WORK" && npm run verify >/dev/null 2>&1 ); then
  echo "VERIFY: pass" >&2
else
  echo "VERIFY: fail" >&2
fi
echo "captured: $OUT (workspace: $WORK)" >&2
