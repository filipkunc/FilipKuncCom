import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  step,
  saveGame,
  platforms,
  TREATS,
} from "../public/engine.mjs";
import { tick, driver } from "./driver.mjs";

test("holding jump is higher than a short tap and cannot double-jump in mid-air", () => {
  const held = createGame(),
    tap = createGame();
  let heldTop = held.p.y,
    tapTop = tap.p.y;
  for (let i = 0; i < 55; i++) {
    step(held, { jump: true });
    step(tap, { jump: i < 4 || i === 20 });
    heldTop = Math.min(heldTop, held.p.y);
    tapTop = Math.min(tapTop, tap.p.y);
  }
  assert.ok(heldTop < tapTop - 45);
  assert.ok(held.p.grounded);
  assert.equal(held.p.y, 724);
});
test("checkpoint recovery retains rescued animals, collectibles and key", () => {
  const g = createGame();
  g.checkpoint = 2;
  g.rescued[0] = true;
  g.collected[0] = true;
  g.key = true;
  g.gate = true;
  g.p.y = 1050;
  tick(g);
  assert.equal(g.p.x, 2300);
  assert.equal(g.p.y, 724);
  assert.equal(g.rescued[0], true);
  assert.equal(g.collected[0], true);
  assert.equal(g.key, true);
  const resumed = createGame(saveGame(g));
  assert.equal(resumed.p.x, 2300);
  assert.deepEqual(resumed.rescued, g.rescued);
});
test("gate blocks without the key and opens with it", () => {
  const g = createGame();
  g.p.x = 2110;
  g.enemies = [];
  tick(g, { right: true }, 60);
  assert.ok(g.p.x + g.p.w <= 2180);
  assert.equal(g.gate, false);
  g.key = true;
  tick(g, { right: true }, 40);
  assert.equal(g.gate, true);
  assert.ok(g.p.x > 2222);
});
test("bark temporarily stuns a nearby hedgehog and can be used again after cooldown", () => {
  const g = createGame();
  g.p.x = 850;
  tick(g, { bark: true });
  assert.ok(g.enemies[0].asleep > 3);
  const x = g.enemies[0].x;
  tick(g, {}, 45);
  assert.equal(g.enemies[0].x, x);
  tick(g, { bark: true });
  assert.ok(g.enemies[0].asleep > 3);
  g.p.x = 100;
  tick(g, {}, 300);
  assert.equal(g.enemies[0].asleep, 0);
});
test("standing on a moving log carries the puppy", () => {
  const g = createGame(),
    raft = platforms(g.time).find((p) => p.id === "raft-0");
  Object.assign(g.p, {
    x: raft.x + 50,
    y: raft.y - g.p.h,
    grounded: true,
    platform: raft.id,
  });
  const old = g.p.x;
  tick(g, {}, 30);
  assert.ok(g.p.x > old + 20);
  assert.equal(g.p.platform, "raft-0");
});
test("a full level is completable with actual movement and jumps, including the optional secret", () => {
  const g = createGame(),
    d = driver(g);
  d.move(270);
  d.jump(420);
  assert.equal(g.p.y + g.p.h, 670);
  d.jump(680);
  d.move(720);
  assert.equal(g.rescued[0], true);
  d.move(765);
  d.jump(1000);
  d.move(1000);
  assert.equal(g.secret, true);
  d.move(1180);
  d.until(() => g.p.grounded, {});
  d.until(() => g.p.vy < -900, { right: true });
  d.until(
    () => g.p.grounded,
    () => ({ right: g.p.x < 1485, left: g.p.x > 1495, jump: true }),
  );
  assert.equal(g.p.y + g.p.h, 510);
  assert.equal(g.key, true);
  d.move(1560);
  d.jump(1800);
  d.move(1820);
  assert.equal(g.rescued[1], true);
  d.move(2350);
  d.until(() => g.p.grounded, {});
  assert.equal(g.gate, true);
  assert.equal(g.checkpoint, 2);
  d.move(2470);
  d.jump(() => platforms(g.time).find((p) => p.id === "raft-0").x + 45);
  assert.equal(g.p.platform, "raft-0");
  d.until(
    () => platforms(g.time).find((p) => p.id === "raft-1").x - g.p.x < 180,
    {},
  );
  d.jump(() => platforms(g.time).find((p) => p.id === "raft-1").x + 30);
  assert.equal(g.p.platform, "raft-1");
  d.jump(3020);
  d.move(3070);
  assert.equal(g.checkpoint, 3);
  d.move(3090);
  d.jump(3190);
  assert.equal(g.p.y + g.p.h, 660);
  d.move(3250);
  d.jump(3420);
  d.move(3470);
  assert.equal(g.rescued[2], true);
  d.until(() => g.won, { right: true });
  assert.equal(g.won, true);
  assert.equal(g.respawns, 0);
  assert.ok(g.collected.filter(Boolean).length > 10);
});
test("exit requires every rescue; malformed saved progress cannot create a win", () => {
  const g = createGame({
    version: 2,
    checkpoint: 99,
    rescued: [false],
    collected: null,
    key: false,
    gate: true,
  });
  assert.equal(g.checkpoint, 3);
  assert.equal(g.gate, false);
  assert.equal(g.collected.length, TREATS.length);
  g.p.x = 3820;
  tick(g, {}, 5);
  assert.equal(g.won, false);
});

test("latched taps trigger jump and bark even when released before a simulation tick", () => {
  const g = createGame();
  step(g, { jumpPressed: true, barkPressed: true });
  assert.ok(g.p.vy < 0);
  assert.ok(g.bark > 0);
  assert.equal(g.p.grounded, false);
});
