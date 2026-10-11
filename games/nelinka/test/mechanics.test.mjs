import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  platforms,
  saveGame,
} from "../public/engine.mjs";
import { SINK_CYCLE } from "../public/mechanics.mjs";
import { tick } from "./driver.mjs";

test("stepping on a stone starts a warning, carries the rider down and removes the submerged foothold", () => {
  const g = createGame({ version: 3, level: 2, checkpoint: 3 });
  const i = g.level.terrain.findIndex((p) => p.sinking);
  const stone = () =>
    platforms(g.time, g.level, g).find((p) => p.sinkIndex === i);
  const initial = stone().y;
  Object.assign(g.p, {
    x: stone().x + 35,
    y: initial - g.p.h,
    vy: 0,
    grounded: true,
    platform: stone().id,
  });
  tick(g);
  assert.equal(stone().sinkPose.phase, "warning");
  tick(g, {}, 30);
  assert.equal(stone().y, initial);
  tick(g, {}, 45);
  assert.ok(stone().y > initial + 20);
  assert.equal(g.p.y + g.p.h, stone().y);
  assert.ok(g.p.grounded);
  tick(g, {}, 36);
  assert.equal(stone().solid, false);
  assert.equal(g.p.grounded, false);
  tick(g, {}, 100);
  assert.equal(g.respawns, 1);
  assert.equal(g.p.x, g.level.flags[2].x);
  assert.equal(stone().sinkPose.phase, "ready");
});

test("abandoned stones return on their own; pausing simulation does not advance them", () => {
  const g = createGame({ version: 3, level: 2 });
  const i = g.level.terrain.findIndex((p) => p.sinking);
  g.sinking[i] = g.time;
  tick(g, {}, 120);
  const paused = platforms(g.time, g.level, g).find((p) => p.sinkIndex === i);
  assert.equal(paused.sinkPose.phase, "sinking");
  assert.deepEqual(
    platforms(g.time, g.level, g).find((p) => p.sinkIndex === i),
    paused,
  );
  tick(g, {}, Math.ceil(SINK_CYCLE * 60));
  const restored = platforms(g.time, g.level, g).find((p) => p.sinkIndex === i);
  assert.equal(restored.sinkPose.phase, "ready");
  assert.equal(restored.y, restored.baseY);
  assert.equal(restored.solid, true);
});

test("only a nearby bark unfolds the flower bridge; it persists through saves and checkpoint recovery", () => {
  const g = createGame({ version: 3, level: 1, checkpoint: 2 });
  g.p.x = 2100;
  tick(g, { bark: true });
  assert.equal(g.bridges[0], false);
  tick(g, {}, 40);
  g.p.x = 2330;
  tick(g);
  assert.equal(g.bridges[0], false);
  tick(g, { bark: true });
  assert.equal(g.bridges[0], true);
  assert.equal(
    platforms(g.time, g.level, g).find((p) => p.flower).solid,
    false,
  );
  tick(g, {}, 40);
  assert.equal(
    platforms(g.time, g.level, g).filter((p) => p.flower && p.solid).length,
    2,
  );
  const restored = createGame(saveGame(g));
  assert.equal(restored.bridges[0], true);
  assert.equal(
    platforms(0, restored.level, restored).filter((p) => p.flower && p.solid)
      .length,
    2,
  );
  g.p.y = 1100;
  tick(g);
  assert.equal(g.bridges[0], true);
});

test("a leaf carries a standing rider through an entire up-and-down cycle", () => {
  const g = createGame({ version: 3, level: 3 });
  const leaf = () =>
    platforms(g.time, g.level, g).find((p) => p.id === "lift-0");
  Object.assign(g.p, {
    x: leaf().x + 25,
    y: leaf().y - g.p.h,
    vy: 0,
    grounded: true,
    platform: "lift-0",
  });
  for (let i = 0; i < 390; i++) {
    tick(g);
    assert.equal(g.p.platform, "lift-0");
    assert.ok(Math.abs(g.p.y + g.p.h - leaf().y) < 0.01);
  }
  assert.equal(g.respawns, 0);
});
