import test from "node:test";
import assert from "node:assert/strict";
import {
  createEnemy,
  updateEnemy,
  enemyBounds,
  calmEnemy,
} from "../public/enemies.mjs";
import { createGame, LEVELS } from "../public/engine.mjs";
import { tick } from "./driver.mjs";

const frog = () =>
  createEnemy({
    kind: "frog",
    x: 930,
    min: 850,
    max: 1050,
    y: 780,
    dir: 1,
    speed: 130,
    sleepDuration: 2.2,
    delay: 0.2,
  });
test("frog warns before a bounded hop, lands, rests and repeats", () => {
  const e = frog();
  for (let i = 0; i < 13; i++) updateEnemy(e, 1 / 60);
  assert.equal(e.phase, "crouch");
  assert.equal(e.x, 930);
  assert.equal(e.y, 780);
  for (let i = 0; i < 19; i++) updateEnemy(e, 1 / 60);
  assert.equal(e.phase, "hop");
  assert.ok(e.y < 780);
  let hops = 0,
    previous = e.phase;
  for (let i = 0; i < 600; i++) {
    updateEnemy(e, 1 / 60);
    assert.ok(e.x >= e.min && e.x <= e.max);
    assert.ok(e.y <= e.baseY && e.y >= e.baseY - 55);
    if (previous !== "hop" && e.phase === "hop") hops++;
    if (e.phase === "wait") assert.equal(e.y, e.baseY);
    previous = e.phase;
  }
  assert.ok(hops >= 4);
});
test("barked-at airborne frog lands safely, waits, and resumes after its shorter stun", () => {
  const e = frog();
  for (let i = 0; i < 43; i++) updateEnemy(e, 1 / 60);
  assert.equal(e.phase, "hop");
  assert.equal(calmEnemy(e), true);
  assert.equal(calmEnemy(e), false);
  const x = e.x;
  for (let i = 0; i < 100; i++) updateEnemy(e, 1 / 60);
  assert.equal(e.x, x);
  assert.equal(e.y, e.baseY);
  assert.ok(e.asleep > 0);
  for (let i = 0; i < 100; i++) updateEnemy(e, 1 / 60);
  assert.equal(e.asleep, 0);
  assert.notEqual(e.x, x);
});
test("bee patrol bobs in the air, freezes when calmed and wakes sooner than a frog", () => {
  const e = createEnemy({
    kind: "bee",
    x: 650,
    min: 560,
    max: 720,
    y: 520,
    speed: 85,
    dir: 1,
    sleepDuration: 1.6,
  });
  const heights = new Set();
  for (let i = 0; i < 180; i++) {
    updateEnemy(e, 1 / 60);
    assert.ok(e.x >= 560 && e.x <= 720);
    assert.ok(Math.abs(e.y - 520) <= 18);
    heights.add(Math.round(e.y));
  }
  assert.ok(heights.size > 20);
  calmEnemy(e);
  const bounds = enemyBounds(e);
  for (let i = 0; i < 60; i++) updateEnemy(e, 1 / 60);
  assert.deepEqual(enemyBounds(e), bounds);
  for (let i = 0; i < 42; i++) updateEnemy(e, 1 / 60);
  assert.equal(e.asleep, 0);
  assert.notDeepEqual(enemyBounds(e), bounds);
});
for (const kind of ["frog", "bee"]) {
  test(`${kind} contact returns Nelinka to the checkpoint; a nearby bark lets her pass`, () => {
    function encounter() {
      const g = createGame();
      g.p.x = 905;
      g.rescued[0] = true;
      g.enemies = [
        createEnemy({
          kind,
          x: 930,
          y: 780,
          min: 850,
          max: 1050,
          dir: 1,
          speed: 85,
          sleepDuration: 2,
        }),
      ];
      return g;
    }
    const hit = encounter();
    tick(hit);
    assert.equal(hit.respawns, 1);
    assert.equal(hit.p.x, 100);
    assert.equal(hit.rescued[0], true);
    const safe = encounter();
    tick(safe, { bark: true });
    tick(safe, { right: true }, 30);
    assert.equal(safe.respawns, 0);
    assert.ok(safe.p.x > safe.enemies[0].x + 30);
    // A ground-level bark cannot neutralize an enemy high on a branch.
    const high = encounter();
    high.enemies[0].y = high.enemies[0].baseY = 450;
    tick(high, { bark: true });
    assert.equal(high.enemies[0].asleep, 0);
  });
}
test("every walking/hopping patrol stays on its own bank or branch; new later-level checkpoints stay clear", () => {
  for (const level of LEVELS) {
    for (const e of level.enemies) {
      if (e.kind !== "bee")
        assert.ok(
          level.terrain.some(
            (p) =>
              !p.sinking &&
              p.y === e.y &&
              p.x <= e.min - 20 &&
              p.x + p.w >= e.max + 20,
          ),
          `${level.id}: unsupported ${e.kind} patrol at ${e.x}`,
        );
      if (level !== LEVELS[0])
        for (const f of level.flags) {
          if (Math.abs(e.y - f.y) < 90)
            assert.ok(
              e.max < f.x - 65 || e.min > f.x + 85,
              `${level.id}: checkpoint ${f.x} is inside a patrol`,
            );
        }
    }
  }
});
