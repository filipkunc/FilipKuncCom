import { test, expect, type Page } from "@playwright/test";

async function resumeLevel(page: Page, level: number, checkpoint: number) {
  await page.addInitScript(
    ({ level, checkpoint }) => {
      localStorage.setItem(
        "tlapkovy-adventure-v3",
        JSON.stringify({ version: 3, level, checkpoint }),
      );
    },
    { level, checkpoint },
  );
  await page.goto("/nelinka-classic");
  await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
}

test("E plays the recorded bark, resumes suspended audio and respects mute", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const contexts = new Set<AudioContext>();
    const plays: { duration: number; peak: number; state: string }[] = [];
    Object.assign(window, { barkContexts: contexts, barkPlays: plays });
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      contexts.add(this);
      return create.call(this);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (
      ...args: Parameters<typeof start>
    ) {
      const samples = this.buffer?.getChannelData(0);
      plays.push({
        duration: this.buffer?.duration || 0,
        peak: samples?.reduce((p, v) => Math.max(p, Math.abs(v)), 0) || 0,
        state: this.context.state,
      });
      start.apply(this, args);
    };
  });
  await page.goto("/nelinka-classic");
  await page.getByRole("button", { name: "Vyrazit do lesa" }).click();
  await page.keyboard.press("e");
  await expect
    .poll(() => page.evaluate(() => (window as any).barkPlays.length))
    .toBe(1);
  const first = await page.evaluate(() => (window as any).barkPlays[0]);
  expect(first.duration).toBeCloseTo(0.4, 2);
  expect(first.peak).toBeGreaterThan(0.15);
  expect(first.state).toBe("running");
  await expect(page.locator("#game")).toHaveAttribute(
    "data-bark-ready",
    "true",
  );
  await page.evaluate(async () => {
    for (const c of (window as any).barkContexts) await c.suspend();
  });
  await page.keyboard.press("e");
  await expect
    .poll(() => page.evaluate(() => (window as any).barkPlays.length))
    .toBe(2);
  await page.getByRole("button", { name: "Vypnout zvuk" }).click();
  await expect(page.locator("#game")).toHaveAttribute(
    "data-bark-ready",
    "true",
  );
  await page.keyboard.press("e");
  await expect(page.locator("#game")).toHaveAttribute("data-animation", "bark");
  expect(await page.evaluate(() => (window as any).barkPlays.length)).toBe(2);
  await page.getByRole("button", { name: "Zapnout zvuk" }).click();
  await expect(page.locator("#game")).toHaveAttribute(
    "data-bark-ready",
    "true",
  );
  await page.keyboard.press("e");
  await expect
    .poll(() => page.evaluate(() => (window as any).barkPlays.length))
    .toBe(3);
});

test("a nearby bark unfolds a flower bridge and saves it", async ({
  page,
}, info) => {
  await resumeLevel(page, 1, 2);
  const canvas = page.locator("#game");
  await expect(canvas).toHaveAttribute("data-bridges", "0");
  await canvas.screenshot({ path: info.outputPath("flower-buds.png") });
  await page.keyboard.press("e");
  await expect(canvas).toHaveAttribute("data-bridges", "1");
  await page.waitForTimeout(700);
  await canvas.screenshot({ path: info.outputPath("flower-bridge.png") });
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("tlapkovy-adventure-v3")!).bridges,
    ),
  ).toEqual([true]);
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("Space");
  await page.waitForFunction(
    () =>
      Number(document.querySelector<HTMLCanvasElement>("#game")!.dataset.x) >
      2510,
  );
  await page.keyboard.up("ArrowRight");
  await expect(canvas).toHaveAttribute("data-platform", "bridge-0-0");
  await page.keyboard.up("Space");
});

test("a landed-on stone visibly sinks, drops its rider and resets at the checkpoint", async ({
  page,
}, info) => {
  await resumeLevel(page, 2, 3);
  const canvas = page.locator("#game");
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("Space");
  await page.waitForFunction(
    () =>
      Number(document.querySelector<HTMLCanvasElement>("#game")!.dataset.x) >
      2650,
  );
  await page.keyboard.up("ArrowRight");
  await expect(canvas).toHaveAttribute("data-sinking", "warning");
  await page.keyboard.up("Space");
  const top = Number(await canvas.getAttribute("data-y"));
  await expect(canvas).toHaveAttribute("data-sinking", "sinking");
  await page.waitForFunction(
    (top) =>
      Number(document.querySelector<HTMLCanvasElement>("#game")!.dataset.y) >
      top + 25,
    top,
  );
  await canvas.screenshot({ path: info.outputPath("stone-sinking.png") });
  await expect(page.locator("#instruction")).toContainText("Nic se neděje");
  await expect(canvas).toHaveAttribute("data-x", "2540");
  await expect(canvas).toHaveAttribute("data-sinking", "");
});

test("leaf lift renders its route and carries Nelinka up", async ({
  page,
}, info) => {
  await resumeLevel(page, 3, 3);
  const canvas = page.locator("#game");
  // Board from the bank while the leaf is near its lower turnaround.
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("Space");
  await page.waitForFunction(
    () =>
      Number(document.querySelector<HTMLCanvasElement>("#game")!.dataset.x) >
      2690,
  );
  await page.keyboard.up("ArrowRight");
  await expect(canvas).toHaveAttribute("data-platform", "lift-1");
  await page.keyboard.up("Space");
  const start = Number(await canvas.getAttribute("data-y"));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-y")))
    .toBeLessThan(start - 80);
  await canvas.screenshot({ path: info.outputPath("leaf-lift.png") });
});
