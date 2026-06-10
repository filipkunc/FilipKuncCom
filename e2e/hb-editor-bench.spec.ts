import { test, expect } from '@playwright/test';
// @ts-ignore — plain ESM module without types
import { startServer } from '../scripts/hb-editor/serve.mjs';

const PORT = 4796;
const URL_ = `http://127.0.0.1:${PORT}/web/bench/?quick=1`;

let server: { close: () => void };

test.beforeAll(async () => {
  server = await startServer(PORT);
});

test.afterAll(() => {
  server.close();
});

test('zoom benchmark measures all three pipelines', async ({ page }) => {
  await page.goto(URL_);
  await page.waitForFunction(() => (window as any).__benchReady === true, undefined, {
    timeout: 30_000,
  });
  const res = await page.evaluate(() => (window as any).__bench.run());
  expect(res.results).toHaveLength(3);
  expect(res.glyphsPerFrame).toBeGreaterThan(100);
  for (const r of res.results) {
    expect(r.frames).toBeGreaterThan(5);
    expect(r.fps).toBeGreaterThan(1);
    expect(r.p99).toBeGreaterThanOrEqual(r.avg * 0.5);
  }
  await expect(page.locator('#results table tr')).toHaveCount(4);
});

test('hb pipeline actually inks pixels, and zoom changes the frame', async ({ page }) => {
  await page.goto(URL_);
  await page.waitForFunction(() => (window as any).__benchReady === true);
  const small = await page.evaluate(() => (window as any).__bench.drawHbOnce(0));
  // A quarter period later the sine is at max size -> more ink.
  const large = await page.evaluate(() => (window as any).__bench.drawHbOnce(600));
  expect(small.inked).toBeGreaterThan(1000);
  expect(large.inked).toBeGreaterThan(small.inked);
});
