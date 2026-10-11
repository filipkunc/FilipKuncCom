import assert from "node:assert/strict";
import { step } from "../public/engine.mjs";
export const tick = (g, input = {}, n = 1) => {
  for (let i = 0; i < n; i++) step(g, input);
};
export function driver(g) {
  function until(condition, input, limit = 600) {
    for (let i = 0; i < limit; i++) {
      if (condition()) return;
      const value = typeof input === "function" ? input() : input;
      step(g, {
        bark:
          g.barkCooldown === 0 &&
          !g.wasBark &&
          g.enemies.some(
            (e) =>
              Math.abs(e.x - g.p.x) < 130 &&
              Math.abs(e.y - 20 - (g.p.y + g.p.h / 2)) < 85,
          ),
        ...value,
      });
    }
    assert.fail(
      `Route timed out: ${JSON.stringify({ p: g.p, rescued: g.rescued, key: g.key, checkpoint: g.checkpoint, time: g.time })}`,
    );
  }
  function move(x) {
    until(
      () => Math.abs(g.p.x - x) < 7,
      () => ({ right: g.p.x < x, left: g.p.x > x }),
    );
    tick(g, {}, 12);
  }
  function jump(target) {
    tick(g, {}, 2);
    tick(g, { jump: true }, 1);
    until(
      () => g.p.grounded,
      () => {
        const x = typeof target === "function" ? target() : target;
        return { jump: true, right: g.p.x < x - 5, left: g.p.x > x + 5 };
      },
    );
    tick(g, {}, 2);
  }
  return { move, jump, until };
}
