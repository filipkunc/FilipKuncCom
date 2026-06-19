---
name: add-endpoint
description: Add or modify an endpoint in the notes API correctly and verifiably. Use whenever the task is to add, change, or extend an HTTP endpoint in this project.
---

# Add an endpoint

<!-- #region step-read-ticket -->
1. **Read the ticket** named in the task (e.g. NOTES-1234) with the `get_ticket` MCP tool. Follow its acceptance criteria exactly. Do not guess them.
<!-- #endregion -->
2. **Implement the route** in `src/app.js`, matching the existing ones. Use the response shape and error format the ticket asks for, not the one a nearby route happens to use. The existing routes answer errors with a bare `{ error }`, so do not assume that is the house format. Stay read-only.
3. **Add tests** in `test/feature.test.js`. Leave `test/contract.test.js` alone.
4. **Run `npm run verify`.** Done means green. Never weaken a test or silence the linter to get there.
