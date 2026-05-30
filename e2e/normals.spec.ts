import { test, expect, type Page } from '@playwright/test';

// These tests drive the live WebGPU demo. The one that matters most is
// "GPU compute matches the CPU reference": it reads the normals buffer back and
// compares it to the CPU result. The reserved-word `meta` bug that blanked the
// GPU path produced an all-zero buffer, so the max delta was ~1 instead of ~0.
// This is the regression guard for that whole class of silent-shader failures.

declare global {
  interface Window {
    __normalsLab?: {
      setMesh(name: string, subdivisions?: number): void;
      setComputeMode(mode: 'gpu' | 'cpu'): void;
      setShowNormals(show: boolean): void;
      vertexCount(): number;
      measureReadback(): Promise<{ bytes: number; ms: number; maxDelta: number; vertexCount: number }>;
      renderToPixels(size?: number): Promise<{ opaque: number; total: number }>;
      adapterInfo(): { architecture: string };
    };
  }
}

// Bring the island into view, hydrate it, and wait for the GPU device to come
// up. Skips the test cleanly if this machine genuinely has no WebGPU at all.
async function openLab(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /WebGPU|normals-lab/i.test(m.text())) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/posts/gpu-normals');
  await page.locator('.nl-stage').scrollIntoViewIfNeeded();

  const ready = await page
    .waitForFunction(() => !!window.__normalsLab, null, { timeout: 25_000 })
    .then(() => true)
    .catch(() => false);

  if (!ready) {
    const overlay = await page.locator('.nl-overlay').innerText().catch(() => '');
    test.skip(/needs WebGPU/i.test(overlay), 'WebGPU is not available in this environment');
    throw new Error(`Lab never became ready. Overlay said: ${overlay || '(none)'}`);
  }
  return errors;
}

test('GPU compute matches the CPU reference (no silent shader failure)', async ({ page }) => {
  const errors = await openLab(page);
  const result = await page.evaluate(async () => {
    const lab = window.__normalsLab!;
    lab.setComputeMode('gpu');
    return lab.measureReadback();
  });
  expect(result.bytes).toBeGreaterThan(0);
  // GPU and CPU should agree to float32 rounding. The bug pushed this to ~1.
  expect(result.maxDelta).toBeLessThan(1e-3);
  expect(errors, `WebGPU errors:\n${errors.join('\n')}`).toEqual([]);
});

test('the mesh rasterizes in GPU mode', async ({ page }) => {
  await openLab(page);
  const { opaque, total } = await page.evaluate(async () => {
    window.__normalsLab!.setComputeMode('gpu');
    return window.__normalsLab!.renderToPixels(64);
  });
  // The shaded mesh fills a healthy chunk of the frame and the background is
  // transparent, so a blank frame would read as zero opaque pixels.
  expect(opaque).toBeGreaterThan(total * 0.1);
});

test('the mesh rasterizes in CPU mode', async ({ page }) => {
  await openLab(page);
  const { opaque, total } = await page.evaluate(async () => {
    window.__normalsLab!.setComputeMode('cpu');
    return window.__normalsLab!.renderToPixels(64);
  });
  expect(opaque).toBeGreaterThan(total * 0.1);
});

test('the canvas presents on real hardware', async ({ page }) => {
  await openLab(page);
  const arch = await page.evaluate(() => window.__normalsLab!.adapterInfo().architecture);
  test.skip(/swiftshader|software|lavapipe|warp/i.test(arch), `software adapter (${arch}) cannot present a canvas`);
  await page.evaluate(() => window.__normalsLab!.setComputeMode('gpu'));
  await page.waitForTimeout(400);
  const opaque = await page.evaluate(() => {
    const src = document.querySelector('.nl-canvas') as HTMLCanvasElement;
    const off = document.createElement('canvas');
    off.width = src.width;
    off.height = src.height;
    const ctx = off.getContext('2d')!;
    ctx.drawImage(src, 0, 0);
    const { data } = ctx.getImageData(0, 0, off.width, off.height);
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 16) count++;
    return count;
  });
  expect(opaque).toBeGreaterThan(500);
});

test('switching mesh and detail keeps the GPU result correct', async ({ page }) => {
  await openLab(page);
  const result = await page.evaluate(async () => {
    const lab = window.__normalsLab!;
    lab.setComputeMode('gpu');
    lab.setMesh('icosphere', 3);
    const r = await lab.measureReadback();
    return { ...r, vertices: lab.vertexCount() };
  });
  expect(result.vertices).toBeGreaterThan(600);
  expect(result.maxDelta).toBeLessThan(1e-3);
});
