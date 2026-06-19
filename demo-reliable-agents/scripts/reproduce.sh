#!/usr/bin/env bash
#
# Reproduce every result the blog post quotes, on your own Claude subscription.
# No API key and no per-token billing: this drives `claude -p` headless, exactly
# as you would from the CLI, inside throwaway podman containers.
#
# In a SEPARATE terminal, mint a subscription token and export it here:
#   export CLAUDE_CODE_OAUTH_TOKEN=$(claude setup-token)
# then run:
#   ./scripts/reproduce.sh                     # sonnet, mcp + no-mcp, 2 trials each
#   N=4 ./scripts/reproduce.sh                 # more trials per cell
#   MODES=mcp ./scripts/reproduce.sh           # only the with-MCP arm
#
# Everything the post needs lands in results/.
set -uo pipefail
cd "$(dirname "$0")/.."

MODELS="${MODELS:-claude-sonnet-4-6}"
MODES="${MODES:-mcp,no-mcp}"
N="${N:-2}"

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }
warn() { printf '\033[1;33mWarning:\033[0m %s\n' "$*" >&2; }

# --- preflight -------------------------------------------------------------
command -v node   >/dev/null || die "node not found (need Node 24+)."
command -v podman >/dev/null || die "podman not found (docker works too: s/podman/docker/ in scripts/aggregate.mjs)."
[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ] || die \
  "CLAUDE_CODE_OAUTH_TOKEN is not set. In another shell run: export CLAUDE_CODE_OAUTH_TOKEN=\$(claude setup-token)"
# The containers never inherit a host API key (only -e CLAUDE_CODE_OAUTH_TOKEN is
# passed), so billing stays on the subscription. Flag it anyway as hygiene.
[ -n "${ANTHROPIC_API_KEY:-}" ] && warn "ANTHROPIC_API_KEY is set in this shell. Containers don't inherit it, but unset it to be sure subscription billing is used."
[ -d node_modules ] || { say "installing deps (npm ci)"; npm ci; }

mkdir -p results

# --- phase A: free plumbing self-test (no model, no cost) ------------------
# Proves the harness end to end with a fixed implementation before you spend a
# single subscription token: mcp passes, no-mcp fails, nothing leaks.
say "Phase A: deterministic plumbing self-test (no model, no cost)"
FAKE_AGENT=scripts/fake-agent.mjs node scripts/aggregate.mjs \
  --runner=local --models=demo --modes=mcp,no-mcp --n=1 \
  2>&1 | tee results/plumbing.log
cp runs/agg/results.md results/plumbing.md 2>/dev/null || true

# --- phase B: the real run, on your subscription ---------------------------
say "Phase B: real agents (${MODELS} x ${MODES}, n=${N}) via claude -p in podman"
node scripts/aggregate.mjs \
  --runner=podman --models="$MODELS" --modes="$MODES" --n="$N" \
  2>&1 | tee results/run.log

cp runs/agg/results.md   results/results.md
cp runs/agg/results.json results/results.json
rm -rf results/transcripts && cp -r runs/agg results/transcripts

say "Done. Post artifacts in results/:"
printf '  results/results.md      the pass-rate table + secret/tamper footers\n'
printf '  results/results.json    machine-readable per-trial records\n'
printf '  results/run.log         full console log of the live run\n'
printf '  results/transcripts/    raw agent transcript + gate log (.verify.log) per trial\n\n'
cat results/results.md
