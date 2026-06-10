import { test, expect, type Page } from '@playwright/test';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain ESM module without types
import { startServer } from '../scripts/hb-editor/serve.mjs';

// The hb-editor playground is self-hosted (not part of the Astro site), so
// this spec runs its own static server instead of using baseURL.
const PORT = 4791;
const URL_ = `http://127.0.0.1:${PORT}/`;

let server: { close: () => void };

test.beforeAll(async () => {
  server = await startServer(PORT);
});

test.afterAll(() => {
  server.close();
});

async function open(page: Page) {
  await page.goto(URL_);
  await page.waitForFunction(() => (window as any).__hbeReady === true, undefined, {
    timeout: 30_000,
  });
}

type Stats = { inked: number; partial: number; total: number };

function draw(page: Page, text: string, sizePx: number): Promise<Stats> {
  return page.evaluate(
    ([t, s]) => (window as any).__hbe.draw(t, s, { stemDarkening: false, gamma: 1, debug: false }),
    [text, sizePx] as const,
  );
}

test('playground loads, shapes and renders text via hb-gpu', async ({ page }) => {
  await open(page);
  const stats = await draw(page, 'Hello hb-gpu', 64);
  const frac = stats.inked / stats.total;
  expect(frac).toBeGreaterThan(0.005);
  expect(frac).toBeLessThan(0.5);
});

test('coverage is antialiased, not binary', async ({ page }) => {
  await open(page);
  const stats = await draw(page, 'Hello hb-gpu', 64);
  expect(stats.partial).toBeGreaterThan(100);
  // AA pixels are a minority: edges, not fill.
  expect(stats.partial).toBeLessThan(stats.inked);
});

test('empty text renders nothing', async ({ page }) => {
  await open(page);
  const stats = await draw(page, '', 64);
  expect(stats.inked).toBe(0);
});

test('larger size inks more pixels', async ({ page }) => {
  await open(page);
  const small = await draw(page, 'Inter', 16);
  const large = await draw(page, 'Inter', 96);
  expect(small.inked).toBeGreaterThan(0);
  expect(large.inked).toBeGreaterThan(small.inked * 4);
});

test('rendering is deterministic across redraws', async ({ page }) => {
  await open(page);
  const a = await draw(page, 'determinism ffi', 48);
  const b = await draw(page, 'determinism ffi', 48);
  expect(b).toEqual(a);
});

test('shaping drives rendering: ligature-capable text still inks', async ({ page }) => {
  await open(page);
  // Mixed scripts and combining marks must not throw and must produce ink.
  const stats = await draw(page, 'Týž fjord — naïve', 48);
  expect(stats.inked).toBeGreaterThan(500);
});
