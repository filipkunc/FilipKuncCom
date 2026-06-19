#!/usr/bin/env bash
# Prove no MCP-held credential escaped the boundary: not into the source the
# agent wrote, and not into any captured transcript.
set -euo pipefail
cd "$(dirname "$0")/.."

status=0
while IFS= read -r SECRET; do
  [ -n "$SECRET" ] || continue
  if grep -rqF "$SECRET" src test 2>/dev/null; then
    echo "FAIL: a credential appears in src/ or test/"
    grep -rnF "$SECRET" src test
    status=1
  fi
  if [ -d runs ] && grep -rlF "$SECRET" runs 2>/dev/null; then
    echo "FAIL: a credential appears in a transcript above"
    status=1
  fi
done < <(node -e "const e=require('./.mcp.json').mcpServers['notes-spec'].env; process.stdout.write(Object.values(e).join('\n'))")

[ "$status" -eq 0 ] && echo "ok: no MCP credential found in src/, test/, or transcripts"
exit "$status"
