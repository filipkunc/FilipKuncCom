// Smoke test over the committed wasm artifact + JS wrapper: validates the
// shipped binary, not the Rust source (cargo test covers that). Run with
// `npm run test:flowfield`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FlowField, WALL, INT_COST_MASK, UNREACHABLE, FLOW_DIR_MASK, DIR_NONE,
} from '../js/flowfield.mjs';

const wasmBytes = await readFile(new URL('../dist/flowfield.wasm', import.meta.url));

async function makeField(w, h) {
  return FlowField.load(wasmBytes, w, h);
}

test('computes a field and exposes views', async () => {
  const ff = await makeField(32, 24);
  assert.equal(ff.cost.length, 32 * 24);
  assert.ok(ff.compute(16, 12));
  assert.equal(ff.integration[12 * 32 + 16] & INT_COST_MASK, 0);
  // A corner cell is reachable and its flow direction descends.
  const corner = 0;
  const cost = ff.integration[corner] & INT_COST_MASK;
  assert.notEqual(cost, UNREACHABLE);
  assert.notEqual(ff.flow[corner] & FLOW_DIR_MASK, DIR_NONE);
  ff.dispose();
});

test('walls painted through the cost view block the field', async () => {
  const ff = await makeField(16, 16);
  const cost = ff.cost;
  for (let y = 0; y < 16; y++) cost[y * 16 + 8] = WALL;
  assert.ok(ff.compute(12, 8));
  // Fully sealed left half is unreachable.
  assert.equal(ff.integration[8 * 16 + 2] & INT_COST_MASK, UNREACHABLE);
  // Goal on a wall is rejected.
  assert.equal(ff.compute(8, 0), false);
  ff.dispose();
});

test('agents follow the field toward the goal', async () => {
  const ff = await makeField(32, 32);
  assert.ok(ff.compute(28, 16));
  ff.spawn(4, 16, 300, 42);
  assert.equal(ff.agentCount, 300);
  const before = ff.positions.slice();
  for (let i = 0; i < 600; i++) ff.step(1 / 60);
  const after = ff.positions;
  let movedRight = 0;
  for (let i = 0; i < 300; i++) {
    if (after[2 * i] > before[2 * i] + 5) movedRight++;
  }
  assert.ok(movedRight > 250, `only ${movedRight}/300 agents moved toward the goal`);
  ff.clearAgents();
  assert.equal(ff.agentCount, 0);
  ff.dispose();
});

test('agents come in three kinds and rescale together', async () => {
  const ff = await makeField(32, 32);
  ff.compute(16, 16);
  ff.spawn(16, 16, 600, 5);
  const seen = new Set(ff.kinds);
  assert.deepEqual([...seen].sort(), [0, 1, 2]);
  const before = ff.radii[0];
  ff.setScale(1.3);
  assert.ok(ff.radii[0] > before);
  for (const r of ff.radii) assert.ok(r <= 0.5);
  // Variety 0 collapses all sizes to the medium radius.
  ff.setVariety(0);
  const r0 = ff.radii[0];
  for (const r of ff.radii) assert.ok(Math.abs(r - r0) < 1e-6);
  ff.setVariety(1.6);
  ff.setSpacing(1.5);
  ff.step(1 / 60);
  ff.dispose();
});

test('spawn with the same seed is deterministic', async () => {
  const a = await makeField(32, 32);
  const b = await makeField(32, 32);
  a.compute(16, 16);
  b.compute(16, 16);
  a.spawn(8, 8, 100, 7);
  b.spawn(8, 8, 100, 7);
  for (let i = 0; i < 200; i++) {
    a.step(1 / 60);
    b.step(1 / 60);
  }
  assert.deepEqual(Array.from(a.positions), Array.from(b.positions));
  a.dispose();
  b.dispose();
});
