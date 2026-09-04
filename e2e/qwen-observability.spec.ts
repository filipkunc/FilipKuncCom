import { test, expect } from '@playwright/test';

test('Qwen capture keeps evidence labels visible and interactions working', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto('/posts/qwen-gpu-under-the-hood');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Watching one Qwen3.8 run');
  await expect(page.getByText('Codex helped me set up the capture')).toBeVisible();
  const explainer = page.locator('figure.qwen-model-explainer');
  await expect(explainer.getByRole('tab')).toHaveCount(7);
  await expect(explainer.getByText('The visible question is 9 pieces, not 6 boxes')).toBeVisible();
  await expect(explainer.locator('.qme-question-tokens > span')).toHaveCount(9);
  await explainer.getByRole('tab', { name: '2 · multiply' }).click();
  await expect(explainer.getByText('8 − 3 = 5')).toBeVisible();
  await explainer.getByRole('tab', { name: '3 · remember' }).click();
  await expect(explainer.getByText('new S = gS + k × errorᵀ = [[2, 1], [0, 0.5]]')).toBeVisible();
  await explainer.getByRole('tab', { name: '4 · look back' }).click();
  await expect(explainer.getByText('0.46[2, 0] + 0.22[0, 2] + 0.32[1, 1]')).toBeVisible();
  await explainer.getByRole('tab', { name: '5 · one round' }).click();
  await expect(explainer.locator('.qme-layer-map > span')).toHaveCount(64);
  await explainer.getByRole('tab', { name: '6 · choose' }).click();
  await expect(explainer.getByText('One final dot product for every possible next piece')).toBeVisible();
  await expect(explainer.locator('.qme-logits > div')).toHaveCount(10);
  await explainer.getByRole('tab', { name: '7 · CUDA' }).click();
  await expect(explainer.locator('.qme-kernel-list button')).toHaveCount(7);
  await expect(explainer.getByText('79.0%', { exact: true })).toBeVisible();
  await explainer.locator('[data-kernel="Gated DeltaNet"]').click();
  await expect(explainer.locator('[data-kernel-panel="Gated DeltaNet"]')).toContainText('s_shard[r] = g_val * s_shard[r]');

  await expect(page.getByText('GPU busy · measured by NVML')).toBeVisible();
  await expect(page.getByText('session trace', { exact: true })).toBeVisible();
  const recorder = page.locator('figure.qwen-flight-recorder');
  await expect(recorder.getByRole('tab')).toHaveCount(4);
  await recorder.getByRole('tab', { name: 'execution' }).click();
  await expect(page.getByText('how Qwen makes one more token')).toBeVisible();
  await expect(page.getByText('one token → 5,120 numbers')).toBeVisible();
  await expect(page.getByText('5,120 numbers → 248,320 scores')).toBeVisible();
  await expect(page.getByText('the same representation visits every block')).toBeVisible();
  await expect(page.locator('[data-flow-stage]')).toHaveCount(6);
  await expect(page.locator('[data-trace-phase]')).toHaveCount(5);
  await recorder.getByRole('tab', { name: 'reproduce' }).click();
  await expect(page.getByText('reproduction map', { exact: true })).toBeVisible();
  await recorder.getByRole('tab', { name: 'CUDA' }).click();
  await expect(page.getByText('set_rows-name matches', { exact: true })).toBeVisible();
  await recorder.getByRole('tab', { name: 'overview' }).click();
  await expect(page.locator('.qfr-layers [data-layer]')).toHaveCount(64);

  await page.locator('.qfr-phase[data-phase="turn-3"]').click();
  await expect(page.locator('.qfr-current-phase')).toHaveText('Qwen answers');

  const detailHeight = await page.locator('.qfr-span-panels').evaluate((element) => element.getBoundingClientRect().height);
  await page.locator('[data-trace-phase="tool-1"]').click();
  await expect(page.locator('.qfr-current-phase')).toHaveText('Python + capture');
  await expect(recorder.getByRole('tab', { name: 'overview' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-span-panel="tool-1"] .qfr-tool-code')).toContainText('x*math.log(x)');
  await expect(page.locator('[data-span-panel="tool-1"] .qfr-tool-output')).toContainText('2.5061841455887692 10.0');
  const toolDetailHeight = await page.locator('.qfr-span-panels').evaluate((element) => element.getBoundingClientRect().height);
  expect(Math.abs(toolDetailHeight - detailHeight)).toBeLessThan(1);

  await page.locator('.qkv-slider').fill('29440');
  await expect(page.locator('.qkv-hybrid-value')).toHaveText('1.80 GiB');
  await expect(page.locator('.qkv-all-value')).toHaveText('7.19 GiB');

  for (const width of [860, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('*')]
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          right: element.getBoundingClientRect().right,
          text: element.textContent?.slice(0, 100),
        })),
    }));
    expect(layout.overflow, JSON.stringify(layout.offenders)).toBeLessThanOrEqual(0);
  }

  expect(errors).toEqual([]);
});
