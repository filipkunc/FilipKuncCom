import { test, expect } from "@playwright/test";

test("Czech rescue can be completed and replayed; sticker survives a reload", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/nelinka/calm.html");
  await expect(page).toHaveTitle(/Tlapkový klub/);
  await expect(page.locator("html")).toHaveAttribute("lang", "cs");
  await expect(page.locator("#progress")).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("desktop-intro.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Vypnout zvuk" }).click();
  await page.getByRole("button", { name: "Jdeme na to!" }).click();
  for (let i = 0; i < 3; i++) {
    await page.locator(`#duck-${i}`).click();
    await expect(page.locator(`#duck-${i}`)).toBeDisabled({ timeout: 10_000 });
    await expect(page.locator("#progress")).toHaveAttribute(
      "aria-label",
      `Nalezená káčátka: ${i + 1} ze 3`,
    );
  }
  await page.screenshot({
    path: testInfo.outputPath("desktop-playing.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Dovést káčátka k rybníku" }).click();
  await expect(page.locator("#win")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#stickers")).toHaveText("1");
  await page.getByRole("button", { name: "Hrát znovu" }).click();
  await expect(page.locator("#win")).toBeHidden();
  await expect(page.locator("#progress")).toHaveAttribute(
    "aria-label",
    "Nalezená káčátka: 0 ze 3",
  );
  await expect(page.locator(".duck:enabled")).toHaveCount(3);
  await page.reload();
  await expect(page.locator("#stickers")).toHaveText("1");
  expect(errors).toEqual([]);
});

test("keyboard movement pauses for help and early pond arrival does not win", async ({
  page,
}) => {
  await page.goto("/nelinka/calm.html");
  await page.getByRole("button", { name: "Jdeme na to!" }).click();
  const puppy = page.locator("#puppy");
  const start = await puppy.boundingBox();
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(async () => (await puppy.boundingBox())!.x)
    .toBeGreaterThan(start!.x + 20);
  await page.keyboard.up("ArrowRight");
  await page.getByRole("button", { name: "Nápověda", exact: true }).click();
  const paused = await puppy.getAttribute("style");
  await page.keyboard.press("ArrowRight");
  await expect(puppy).toHaveAttribute("style", paused!);
  await page.getByRole("button", { name: "Rozumím" }).click();
  await page.getByRole("button", { name: "Dovést káčátka k rybníku" }).click();
  await expect(page.locator("#instruction")).toHaveText(
    "Ještě najdeme ostatní káčátka.",
  );
  await expect
    .poll(async () =>
      Number.parseFloat(
        await puppy.evaluate((el) => (el as HTMLElement).style.left),
      ),
    )
    .toBeGreaterThan(78);
  await expect(page.locator("#win")).toBeHidden();
});

test("small touch screen has no horizontal overflow and can start and collect", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/nelinka/calm.html");
  await expect(
    page.getByRole("button", { name: "Jdeme na to!" }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("mobile-intro.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Jdeme na to!" }).click();
  await page.locator("#duck-0").click();
  await expect(page.locator("#duck-0")).toBeDisabled({ timeout: 10_000 });
});
