import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  saveGame,
  nextLevel,
  replayLevel,
  LEVELS,
  platforms,
} from "../public/engine.mjs";
import { tick, driver } from "./driver.mjs";

function route(index) {
  const g = createGame({ version: 3, level: index });
  const d = driver(g);
  function land() {
    d.until(() => g.p.grounded, {});
  }
  function bounce(target) {
    d.until(() => g.p.vy < -900, { right: true });
    d.until(
      () => g.p.grounded,
      () => ({
        right: g.p.x < target - 5,
        left: g.p.x > target + 5,
        jump: true,
      }),
    );
    tick(g, {}, 2);
  }
  function river(first, shore) {
    const raft = (i) =>
      platforms(g.time, g.level).find((p) => p.id === `raft-${i}`);
    d.jump(() => raft(first).x + 40);
    assert.equal(g.p.platform, `raft-${first}`);
    d.until(() => raft(first + 1).x - g.p.x < 180, {});
    d.jump(() => raft(first + 1).x + 30);
    assert.equal(g.p.platform, `raft-${first + 1}`);
    d.jump(shore);
  }
  function ride(index, target) {
    const leaf = () =>
      platforms(g.time, g.level, g).find((p) => p.id === `lift-${index}`);
    d.until(() => leaf().y > 748, {});
    d.jump(() => leaf().x + 45);
    assert.equal(g.p.platform, `lift-${index}`);
    d.until(() => leaf().y < g.level.lifts[index].top + 15, {});
    d.jump(target);
  }
  function flowers() {
    tick(g, { bark: true });
    tick(g, {}, 40);
    assert.ok(g.bridges.every(Boolean));
  }
  return { g, d, land, bounce, river, ride, flowers };
}
const routes = [
  null,
  ({ d, land, bounce, flowers }) => {
    d.move(200);
    d.jump(340);
    d.move(420);
    d.jump(620);
    d.move(640);
    d.move(700);
    d.jump(880);
    d.move(900);
    d.move(1120);
    land();
    d.move(1200);
    bounce(1510);
    d.move(1600);
    d.jump(1800);
    d.move(1820);
    d.move(2330);
    land();
    flowers();
    d.move(2400);
    d.jump(2530);
    d.jump(2690);
    d.jump(2860);
    d.move(2990);
    d.jump(3150);
    d.move(3180);
  },
  ({ d, land, bounce, river }) => {
    d.move(220);
    d.jump(390);
    d.move(415);
    d.move(590);
    land();
    d.move(630);
    river(0, 1190);
    d.move(1200);
    d.jump(1290);
    d.move(1380);
    d.jump(1550);
    d.move(1600);
    d.move(1760);
    land();
    bounce(2050);
    d.move(2140);
    d.jump(2340);
    d.move(2370);
    d.move(2530);
    land();
    d.jump(2660);
    d.jump(2830);
    d.jump(2980);
    d.jump(3090);
    d.move(3120);
    d.move(3140);
    d.jump(3260);
    d.move(3330);
    d.jump(3490);
    d.move(3550);
  },
  ({ d, land, bounce, ride }) => {
    d.move(300);
    ride(0, 600);
    d.move(615);
    d.move(710);
    d.jump(900);
    d.move(915);
    d.move(1120);
    land();
    d.move(1210);
    bounce(1530);
    d.move(1610);
    d.jump(1810);
    d.move(1850);
    d.move(2180);
    land();
    d.move(2200);
    d.jump(2320);
    d.jump(2530);
    d.move(2560);
    d.move(2600);
    ride(1, 2890);
    d.move(2975);
    d.jump(3220);
    d.move(3250);
  },
  ({ g, d, land, bounce, ride, flowers }) => {
    d.move(230);
    d.jump(390);
    d.move(450);
    d.jump(660);
    d.move(685);
    d.move(740);
    d.jump(920);
    d.move(945);
    d.move(1070);
    land();
    d.jump(1200);
    d.jump(1370);
    d.jump(1520);
    d.jump(1640);
    d.move(1660);
    d.move(1710);
    bounce(2020);
    d.move(2100);
    d.jump(2290);
    d.move(2330);
    d.move(2590);
    land();
    d.move(2610);
    const leaf = () =>
      platforms(g.time, g.level, g).find((p) => p.id === "lift-0");
    d.until(() => leaf().y > 748, {});
    d.jump(2710);
    d.until(() => leaf().y < 625, {});
    d.move(2770);
    d.jump(2990);
    d.move(3160);
    land();
    d.move(3110);
    flowers();
    d.jump(3260);
    d.jump(3430);
    d.jump(3610);
    d.move(3710);
    d.jump(3900);
    d.move(3930);
  },
];
for (let i = 1; i < LEVELS.length; i++) {
  test(`${LEVELS[i].title}: real input route rescues all ducks, finds key and secret, and reaches home`, () => {
    const r = route(i);
    routes[i](r);
    assert.deepEqual(r.g.rescued, [true, true, true]);
    assert.equal(r.g.key, true);
    assert.equal(r.g.secret, true);
    r.d.until(() => r.g.won, { right: true });
    assert.equal(r.g.respawns, 0);
    assert.equal(r.g.completed[i].rescued, 3);
    assert.ok(r.g.collected.filter(Boolean).length > 10);
  });
}
test("campaign transitions, completed saves and replay preserve earned results", () => {
  let g = createGame();
  assert.equal(nextLevel(g), null);
  for (let i = 0; i < 5; i++) {
    assert.equal(g.levelIndex, i);
    g.rescued.fill(true);
    g.key = true;
    g.gate = true;
    g.p.x = g.level.exit.x;
    tick(g);
    assert.equal(g.won, true);
    const resumed = createGame(saveGame(g));
    assert.equal(resumed.won, true);
    assert.equal(resumed.levelIndex, i);
    const replay = replayLevel(resumed);
    assert.equal(replay.won, false);
    assert.equal(replay.completed[i].rescued, 3);
    assert.ok(replay.rescued.every((r) => !r));
    const next = nextLevel(resumed);
    if (i === 4) assert.equal(next, null);
    else {
      assert.equal(next.checkpoint, 0);
      assert.equal(next.key, false);
      assert.ok(next.rescued.every((r) => !r));
      g = next;
    }
  }
  assert.equal(g.completed.filter(Boolean).length, 5);
});
test("legacy saves migrate to level one; checkpoint placement follows each level's river banks", () => {
  assert.equal(createGame({ version: 2, checkpoint: 2 }).p.x, 2300);
  for (let level = 0; level < 5; level++) {
    for (
      let checkpoint = 1;
      checkpoint <= LEVELS[level].flags.length;
      checkpoint++
    ) {
      const g = createGame({ version: 3, level, checkpoint });
      assert.equal(g.p.x, g.level.flags[checkpoint - 1].x);
      assert.ok(
        platforms(0, g.level).some((p) => p.id === g.p.platform && p.ground),
      );
      g.p.y = 1100;
      tick(g);
      assert.equal(g.p.x, g.level.flags[checkpoint - 1].x);
    }
  }
});
