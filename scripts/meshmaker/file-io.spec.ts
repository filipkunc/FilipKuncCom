// getItemCount reads scene state straight from the WASM module.
const getItemCount = (page: Page) =>
  page.evaluate(() => (window as any).Module?.getItemCount() ?? 0);

test('OBJ round-trip: export then import restores items', async ({ page }) => {
  await page.click('button[title="Clear Scene"]');
  await page.click('button[title="Add Cube"]');
  await page.click('button[title="Add Sphere"]');
  expect(await getItemCount(page)).toBe(2);

  // Export the scene to OBJ text through the engine.
  const objData = await page.evaluate(() =>
    (window as any).Module.exportToOBJ() as string);

  await page.click('button[title="Clear Scene"]');
  expect(await getItemCount(page)).toBe(0);

  // Re-import and confirm the items come back.
  const success = await page.evaluate(
    (data) => (window as any).Module.importFromOBJ(data) as boolean,
    objData);

  expect(success).toBe(true);
  expect(await getItemCount(page)).toBeGreaterThan(0);
});
