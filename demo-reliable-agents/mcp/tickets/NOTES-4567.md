# NOTES-4567 — Add a note summary endpoint

## Acceptance criteria

- Route: `GET /notes/:id/summary`
- 200 response: JSON `{ id, summary }` and no other fields.
- `summary` is the note body's first sentence. Produce it with `summarize()` from `src/summary-client.js`. Do not reimplement summarization.
- If the note does not exist, respond 404 with our house error envelope: `{ error: { code, message } }`, where `code` is `"NOTE_NOT_FOUND"`. Every error in this service uses this `{ error: { code, message } }` shape, with a SCREAMING_SNAKE_CASE `code` from our error catalog.
- Read-only: never modify or cache anything on the stored note.
