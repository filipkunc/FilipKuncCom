// Hidden acceptance tests for ticket NOTES-4567. The agent never sees this file.
// The harness drops it in only to score, so a passing run had to satisfy the
// ticket's real contract, not whatever the agent guessed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import * as store from "../src/store.js";

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

test("summary returns exactly { id, summary } with the first sentence", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/notes/1/summary`);
    assert.equal(res.status, 200);
    const body = await res.json();
    // Seeded note 1 body: "Hello world. This is the first note."
    assert.deepStrictEqual(body, { id: 1, summary: "Hello world." });
  });
});

// #region judge-404
test("summary 404 uses the house error envelope", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/notes/999/summary`);
    assert.equal(res.status, 404);
    const body = await res.json();
    // House format: { error: { code, message } }, code from the error catalog.
    assert.equal(body.error?.code, "NOTE_NOT_FOUND");
    assert.equal(typeof body.error?.message, "string");
  });
});
// #endregion

test("summary is read-only: it does not mutate the stored note", async () => {
  await withServer(async (base) => {
    const original = {
      id: 1,
      title: "First note",
      body: "Hello world. This is the first note.",
    };
    await fetch(`${base}/notes/1/summary`);
    const after = await (await fetch(`${base}/notes/1`)).json();
    assert.deepStrictEqual(after, original);
  });
});
