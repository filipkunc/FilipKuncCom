// The gate the agent cannot talk past. A missing note must return the house error
// envelope, { error: { code, message } } with code NOTE_NOT_FOUND. We run the SAME
// hidden check against two handlers and let the check decide the outcome, not the
// handler's own opinion of itself.
import http from "node:http";
import assert from "node:assert/strict";

const handlers = {
  // Copies the bare { error } 404 already in the file.
  "copied { error }": (res) => {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  },
  // The house envelope the ticket specifies.
  "house envelope": (res) => {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "NOTE_NOT_FOUND", message: "note 999 not found" } }));
  },
};

// Serve one request and report back what the client saw on the wire.
async function serve(handler) {
  const server = http.createServer((req, res) => handler(res));
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  try {
    const res = await fetch(`http://localhost:${port}/notes/999/summary`);
    const body = await res.json();
    return { status: res.status, code: body.error?.code };
  } finally {
    await new Promise((r) => server.close(r));
  }
}

// The hidden acceptance check, the same one in judge/acceptance.test.js. It reads
// the response, never the implementation's self-report.
for (const [name, handler] of Object.entries(handlers)) {
  const { status, code } = await serve(handler);
  let verdict = "PASS";
  try {
    assert.equal(status, 404);
    assert.equal(code, "NOTE_NOT_FOUND");
  } catch {
    verdict = "FAIL (wrong error shape)";
  }
  console.log(`${name.padEnd(18)} -> error.code: ${String(code).padEnd(16)} GATE: ${verdict}`);
}
