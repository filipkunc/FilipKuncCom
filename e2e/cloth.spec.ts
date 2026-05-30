import { test, expect, type Page } from '@playwright/test';

// The cloth demo deforms every frame, so its normals genuinely cannot be
// precomputed. These tests confirm the GPU simulation moves the sheet and that
// the GPU normals match the CPU reference on the deformed positions.

declare global {
  interface Window {
    __clothLab?: {
      setGrid(step: number): void;
      setNormalsMode(mode: 'gpu' | 'cpu'): void;
      setWind(on: boolean): void;
      setPaused(on: boolean): void;
      stats(): { fps: number; triangles: number; vertices: number; mode: string };
      verifyNormals(): Promise<{ maxDelta: number; vertices: number; movedFromRest: number }>;
      renderToPixels(size?: number): Promise<{ opaque: number; total: number }>;
      adapterInfo(): { architecture: string };
    };
  }
}

async function openCloth(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /WebGPU|cloth-lab|destroyed|AbortError|mapAsync/i.test(m.text())) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/posts/gpu-normals');
  await page.locator('.cl-stage').scrollIntoViewIfNeeded();
  const ready = await page
    .waitForFunction(() => !!window.__clothLab, null, { timeout: 25_000 })
    .then(() => true)
    .catch(() => false);
  if (!ready) {
    const overlay = await page.locator('.cl-overlay').innerText().catch(() => '');
    test.skip(/needs WebGPU/i.test(overlay), 'WebGPU is not available in this environment');
    throw new Error(`Cloth lab never became ready. Overlay: ${overlay || '(none)'}`);
  }
  // Use the smallest grid so the software adapter in CI stays quick.
  await page.evaluate(() => window.__clothLab!.setGrid(0));
  return errors;
}

test('the GPU cloth normals match the CPU reference on a deformed sheet', async ({ page }) => {
  const errors = await openCloth(page);
  const result = await page.evaluate(() => window.__clothLab!.verifyNormals());
  // The sheet must actually have moved off its flat rest pose...
  expect(result.movedFromRest).toBeGreaterThan(0.01);
  // ...and the GPU normals must agree with the CPU reference to float32.
  expect(result.maxDelta).toBeLessThan(1e-3);
  expect(errors, `WebGPU errors:\n${errors.join('\n')}`).toEqual([]);
});

test('the simulation reports a frame rate and triangle count', async ({ page }) => {
  await openCloth(page);
  await page.waitForTimeout(600);
  const stats = await page.evaluate(() => window.__clothLab!.stats());
  expect(stats.triangles).toBeGreaterThan(0);
  expect(stats.fps).toBeGreaterThan(0);
});

test('the cloth rasterizes (not a blank frame)', async ({ page }) => {
  await openCloth(page);
  const { opaque, total } = await page.evaluate(() => window.__clothLab!.renderToPixels(64));
  expect(opaque).toBeGreaterThan(total * 0.1);
});

test('changing grid during a CPU-mode readback does not crash', async ({ page }) => {
  const errors = await openCloth(page);
  // CPU mode reads positions back each frame; changing the grid frees that
  // buffer mid-readback. This used to throw an uncaught AbortError.
  await page.evaluate(async () => {
    const lab = window.__clothLab!;
    lab.setNormalsMode('cpu');
    for (let i = 0; i < 12; i++) {
      lab.setGrid(i % 3);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(500);
  const stats = await page.evaluate(() => window.__clothLab!.stats());
  expect(stats.fps).toBeGreaterThan(0); // still running
  expect(errors.join('\n')).not.toMatch(/destroyed|AbortError/i);
  expect(errors, `errors:\n${errors.join('\n')}`).toEqual([]);
});

test('switching normals to CPU mode keeps running', async ({ page }) => {
  const errors = await openCloth(page);
  await page.evaluate(() => window.__clothLab!.setNormalsMode('cpu'));
  await page.waitForTimeout(700);
  const stats = await page.evaluate(() => window.__clothLab!.stats());
  expect(stats.mode).toBe('cpu');
  expect(stats.fps).toBeGreaterThan(0);
  expect(errors, `WebGPU errors:\n${errors.join('\n')}`).toEqual([]);
});
