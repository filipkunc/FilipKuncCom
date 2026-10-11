import { test, expect } from "@playwright/test";

const titles = [
  "Slunečná paseka",
  "Květinový háj",
  "Říční ostrůvky",
  "Houbové stráně",
  "Lesní slavnost",
];
test.beforeEach(async ({ page }) => {
  // Install each fixture after pagehide has saved the previous live level.
  await page.addInitScript(() => {
    const fixture = sessionStorage.getItem("campaign-fixture");
    if (fixture) {
      localStorage.setItem("tlapkovy-adventure-v3", fixture);
      sessionStorage.removeItem("campaign-fixture");
    }
  });
});
test("all five completion screens advance, save and reset the next level; the finale celebrates fifteen rescues", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/nelinka");
  for (let level = 0; level < 5; level++) {
    // Completed-level fixtures isolate UI transitions; deterministic gameplay
    // tests traverse every route with actual jumps, logs, gates and rescues.
    await page.evaluate(
      (level) =>
        sessionStorage.setItem(
          "campaign-fixture",
          JSON.stringify({
            version: 3,
            level,
            checkpoint: 0,
            rescued: [true, true, true],
            collected: [],
            key: true,
            gate: true,
            secret: true,
            won: true,
            completed: Array.from({ length: 5 }, (_, i) =>
              i <= level ? { rescued: 3, treats: 10, secret: true } : null,
            ),
          }),
        ),
      level,
    );
    await page.reload();
    await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
    await expect(page.locator("#win")).toBeVisible();
    await expect(page.locator("#level-title")).toHaveText(titles[level]);
    await expect(page.locator("#level-progress .complete")).toHaveCount(
      level + 1,
    );
    await page.screenshot({
      path: info.outputPath(`level-${level + 1}-complete.png`),
      fullPage: true,
    });
    if (level < 4) {
      await page.locator("#next-level").click();
      await expect(page.locator("#win")).toBeHidden();
      await expect(page.locator("#game")).toHaveAttribute(
        "data-level",
        String(level + 2),
      );
      await expect(page.locator("#rescued")).toHaveText("0 / 3");
      await expect(page.locator("#key-status")).not.toHaveClass(/found/);
      await page.reload();
      await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
      await expect(page.locator("#level-title")).toHaveText(titles[level + 1]);
      await expect(page.locator("#win")).toBeHidden();
    } else {
      await expect(page.locator("#next-level")).toBeHidden();
      await expect(page.locator("#win-description")).toContainText(
        "15 kamarádů",
      );
      await expect(page.locator("#results")).toContainText("15 / 15");
      await expect(page.locator("#results")).toContainText("5 / 5");
      await page.getByRole("button", { name: "Zopakovat úroveň" }).click();
      await expect(page.locator("#game")).toHaveAttribute("data-level", "5");
      await expect(page.locator("#rescued")).toHaveText("0 / 3");
      await expect(page.locator("#level-progress .complete")).toHaveCount(5);
    }
  }
  expect(errors).toEqual([]);
});

test("river scenery, outlined pickups and new levels render at native resolution", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/nelinka");
  const requests: string[] = [];
  page.on("requestfailed", (request) => {
    // Repeated fixture reloads can cancel the previous page's favicon fetch.
    if (request.failure()?.errorText !== "net::ERR_ABORTED")
      requests.push(request.url());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      requests.push(`${response.status()} ${response.url()}`);
  });
  for (let level = 1; level < 5; level++) {
    await page.evaluate(
      (level) =>
        sessionStorage.setItem(
          "campaign-fixture",
          JSON.stringify({
            version: 3,
            level,
            checkpoint: level === 2 ? 1 : level === 3 ? 2 : level === 4 ? 4 : 2,
          }),
        ),
      level,
    );
    await page.reload();
    await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
    await expect(page.locator("#game")).toHaveAttribute(
      "data-grounded",
      "true",
    );
    await expect(page.locator("#level-title")).toHaveText(titles[level]);
    await page
      .locator("#game")
      .screenshot({ path: info.outputPath(`level-${level + 1}-scenery.png`) });
  }
  // Review the same pickup renderer on a high-contrast patch of the real forest.
  await page.getByRole("button", { name: "Pozastavit hru" }).click();
  await page.evaluate(async () => {
    const { drawPickupStar, drawPickupKey } = await import(
      /* @vite-ignore */ "/nelinka/scenery.mjs"
    );
    const forest = new Image();
    forest.src = "/nelinka/assets/storybook-forest.png";
    await forest.decode();
    const c = document.createElement("canvas");
    c.id = "pickup-review";
    c.width = 640;
    c.height = 220;
    c.style.cssText =
      "position:fixed;top:0;left:0;width:640px;height:220px;z-index:9999";
    const ctx = c.getContext("2d")!;
    ctx.drawImage(forest, 0, 0, 640, 425);
    for (let i = 0; i < 4; i++) drawPickupStar(ctx, 55 + i * 45, 110, 10);
    drawPickupStar(ctx, 315, 110, 22, true);
    drawPickupKey(ctx, 470, 110);
    document.body.append(c);
  });
  await page
    .locator("#pickup-review")
    .screenshot({ path: info.outputPath("outlined-pickups.png") });
  expect(requests).toEqual([]);
});
