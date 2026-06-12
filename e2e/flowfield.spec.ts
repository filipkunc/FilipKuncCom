import { test, expect } from '@playwright/test';

// The flow field demo lives on a draft post, which is routable in `astro dev`
// only (the Playwright webServer runs dev). The demo exposes window.__flowfield
// once mounted.

declare global {
  interface Window {
    __flowfield?: {
      ff: { agentCount: number; positions: Float32Array };
      state: { computeMs: number };
      compute: (x: number, y: number) => boolean;
    };
  }
}

test('flow field demo mounts, computes, and agents move', async ({ page }) => {
  await page.goto('/posts/rts-flow-fields');
  // Demo is lazy-mounted on visibility.
  await page.locator('#flowfield-demo canvas').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !!window.__flowfield, null, { timeout: 30_000 });

  // The starter scene computed a field and spawned agents.
  const initial = await page.evaluate(() => ({
    agents: window.__flowfield!.ff.agentCount,
    computeMs: window.__flowfield!.state.computeMs,
  }));
  expect(initial.agents).toBeGreaterThan(0);
  expect(initial.computeMs).toBeGreaterThan(0);

  // Agents advance between frames.
  const moved = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const ff = window.__flowfield!.ff;
        const before = ff.positions.slice();
        setTimeout(() => {
          const after = ff.positions;
          let moved = 0;
          for (let i = 0; i < before.length; i += 2) {
            const dx = after[i] - before[i];
            const dy = after[i + 1] - before[i + 1];
            if (dx * dx + dy * dy > 0.01) moved++;
          }
          resolve(moved);
        }, 1000);
      }),
  );
  expect(moved).toBeGreaterThan(100);

  // Clicking sets a new goal and recomputes.
  const recomputed = await page.evaluate(() => window.__flowfield!.compute(10, 10));
  expect(recomputed).toBe(true);

  // Spawn button adds agents.
  await page.click('[data-ff-spawn]');
  const after = await page.evaluate(() => window.__flowfield!.ff.agentCount);
  expect(after).toBe(initial.agents + 1000);
});

test('dragging in goal mode moves the goal continuously', async ({ page }) => {
  await page.goto('/posts/rts-flow-fields');
  await page.locator('#flowfield-demo canvas').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !!window.__flowfield, null, { timeout: 30_000 });

  const canvas = page.locator('#flowfield-demo canvas');
  const box = (await canvas.boundingBox())!;
  const goals: { x: number; y: number }[] = [];
  const goalAt = () => page.evaluate(() => ({ ...window.__flowfield!.ff.goal! }));

  // Drag across the right half (open ground in the starter scene).
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3);
  await page.mouse.down();
  goals.push(await goalAt());
  for (const fy of [0.45, 0.6, 0.75]) {
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * fy, { steps: 4 });
    goals.push(await goalAt());
  }
  await page.mouse.up();

  // The goal followed the pointer: strictly descending on the canvas.
  for (let i = 1; i < goals.length; i++) {
    expect(goals[i].y).toBeGreaterThan(goals[i - 1].y);
  }
});
