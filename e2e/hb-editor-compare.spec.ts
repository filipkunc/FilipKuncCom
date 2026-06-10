import { test, expect, type Page } from '@playwright/test';
// @ts-ignore — plain ESM module without types
import { startServer } from '../scripts/hb-editor/serve.mjs';

const PORT = 4795;
const URL_ = `http://127.0.0.1:${PORT}/web/compare/`;

let server: { close: () => void };

test.beforeAll(async () => {
  server = await startServer(PORT);
});

test.afterAll(() => {
  server.close();
});

async function open(page: Page) {
  await page.goto(URL_);
  await page.waitForFunction(() => (window as any).__cmpReady === true, undefined, {
    timeout: 30_000,
  });
}

test('all three panes render ink for the same text', async ({ page }) => {
  await open(page);
  const gl = await page.evaluate(() => (window as any).__cmp.readStats());
  expect(gl.inked).toBeGreaterThan(500);
  const c2d = await page.evaluate(() => (window as any).__cmp.read2d());
  expect(c2d.inked).toBeGreaterThan(500);
  await expect(page.locator('#dom > div')).toHaveCount(5);
});

test('panes react to text changes together', async ({ page }) => {
  await open(page);
  const before = await page.evaluate(() => (window as any).__cmp.readStats());
  await page.locator('#text').fill('iii');
  await page.waitForFunction(
    () => document.querySelector('#dom > div')?.textContent === 'iii',
  );
  const afterGl = await page.evaluate(async () => {
    await (window as any).__cmp.draw();
    return (window as any).__cmp.readStats();
  });
  expect(afterGl.inked).toBeLessThan(before.inked);
  const after2d = await page.evaluate(() => (window as any).__cmp.read2d());
  expect(after2d.inked).toBeLessThan(500 * 5);
});

test('font switch reshapes the hb-gpu pane', async ({ page }) => {
  await open(page);
  await page.locator('#font').selectOption('EBGaramond');
  await page.waitForFunction(() =>
    document.getElementById('status')!.textContent!.includes('glyphs'),
  );
  const gl = await page.evaluate(async () => {
    await (window as any).__cmp.draw();
    return (window as any).__cmp.readStats();
  });
  expect(gl.inked).toBeGreaterThan(500);
});
