# demo-reliable-agents

A minimal notes API used to show that an agent edit can be made *reliable and
verifiable*, not just cheap. The reliability comes from the harness around the
model — a private spec, a hidden test, an isolation boundary — not from the
model itself.

## The task

Implement ticket **NOTES-4567**: add `GET /notes/:id/summary`. The prompt is one
line, the way the task actually arrives:

> Implement ticket NOTES-4567: add a summary endpoint for notes.

The real acceptance criteria are not in the prompt. They live in a private
ticket the agent can read only through an MCP tool. A capable model guesses the
standard parts, but it cannot guess the house error catalog: a missing note must
return `{ error: { code: "NOTE_NOT_FOUND", message } }`. Without the ticket it
copies the file's bare `{ error: "not found" }` and fails the hidden judge.

## The pieces

- `src/` — a tiny zero-dep JSON notes API with three existing endpoints (the pattern to imitate).
- `.claude/skills/add-endpoint/SKILL.md` — the procedure the agent should follow.
- `mcp/server.js` + `mcp/tickets/` — an MCP server that serves the private ticket via the `get_ticket` tool, and holds the summarizer API key so the model never sees it. `.mcp.json` wires it up.
- `judge/acceptance.test.js` — the hidden judge. The agent never sees this file. The harness drops it in only at scoring time, so a pass means the real contract was met.
- `test/contract.test.js` — the visible contract for the existing endpoints.

## Run it

Prerequisites: Node 24, podman (docker works too), and a Claude Pro or Max
subscription. No API key.

```sh
export CLAUDE_CODE_OAUTH_TOKEN=$(claude setup-token)   # in a separate shell
./scripts/reproduce.sh
```

Phase A is a free plumbing self-test (no model, no cost). Phase B drives
`claude -p` headless in throwaway containers, two arms:

- `mcp` — the agent gets the skill and the MCP server.
- `no-mcp` — the control: neither.

Results land in `results/` (a pass-rate table, the transcripts, and the gate
logs). A single trial, if you want to watch one go:

```sh
scripts/run-agent.sh claude-sonnet-4-6 mcp
scripts/run-agent.sh claude-sonnet-4-6 no-mcp
```

## What makes it reliable

Four ways a run can go wrong, each closed by construction rather than by trust:

- **Wrong contract** — the real spec is private, reachable only through the MCP `get_ticket` tool. No ticket, no contract.
- **Weakened test** — the harness restores the pristine contract before scoring and adds the hidden judge only at scoring time, so editing a test cannot buy a pass.
- **Silenced linter** — `verify` runs `eslint --no-inline-config`, so an `eslint-disable` comment is a no-op.
- **Leaked secret** — the MCP server runs in its own container; the agent containers hold no credential. `npm run check:secret` greps for it.

```sh
npm run verify         # eslint --no-inline-config + the test suite
npm run check:secret   # did the API key stay inside the MCP boundary?
```

## Billing

`reproduce.sh` and `run-agent.sh` refuse to run if `ANTHROPIC_API_KEY` is set, so
they always bill the Claude Code subscription rather than the metered API.
