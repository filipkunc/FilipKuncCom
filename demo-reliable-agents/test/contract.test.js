import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import * as store from "../src/store.js";

// The app-runtime summarizer key. In dev/test it is a dummy; the real value
// lives only in the MCP server's config and never reaches this process.
process.env.SUMMARY_API_KEY ??= "test-dummy-key";

async function withServer(fn) {
  store.seed();
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const base = `http://localhost:${port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("GET /notes lists seeded notes", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/notes`);
    assert.equal(res.status, 200);
    const notes = await res.json();
    assert.equal(notes.length, 2);
  });
});

test("GET /notes/:id returns exactly { id, title, body }", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/notes/1`);
    assert.equal(res.status, 200);
    const note = await res.json();
    // A stored note has exactly these three fields. This is an invariant.
    assert.deepStrictEqual(note, {
      id: 1,
      title: "First note",
      body: "Hello world. This is the first note.",
    });
  });
});

test("GET /notes/:id 404s for a missing note", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/notes/999`);
    assert.equal(res.status, 404);
  });
});

test("POST /notes validates input", async () => {
  await withServer(async (base) => {
    const bad = await fetch(`${base}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: 1 }),
    });
    assert.equal(bad.status, 400);

    const ok = await fetch(`${base}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", body: "y" }),
    });
    assert.equal(ok.status, 201);
    const created = await ok.json();
    assert.equal(created.title, "x");
  });
});

// The summary endpoint's contract lives in ticket NOTES-1234 and is checked by
// hidden acceptance tests, not here. These tests guard the existing endpoints.
