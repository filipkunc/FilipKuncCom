# Notes API — house rules

This is a tiny JSON API. When asked to add or change an endpoint, follow the
`add-endpoint` skill. Do not improvise a different procedure.

Conventions:
- When a task names a ticket, read it first with the `get_ticket` MCP tool. The
  ticket holds the real acceptance criteria.
- Match the existing endpoint pattern in `src/app.js` exactly.
- Never hardcode, print, or ask for a credential. Authenticated calls read
  their key from `process.env` at runtime, or go through an MCP tool.
- A change is not done until `npm run verify` passes with every test green.
