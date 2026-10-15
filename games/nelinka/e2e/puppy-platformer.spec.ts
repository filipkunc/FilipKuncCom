import { test, expect } from "@playwright/test";

test("Nelinka uses the complete running cycle and matching action poses", async ({
  page,
}, info) => {
  await page.goto("/nelinka-classic");
  await expect(page.locator(".hero-tag")).toHaveText(
    "Nelinka je připravená! ♥",
  );
  await page.getByRole("button", { name: "Vyrazit do lesa" }).click();
  const observed = page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const c = document.querySelector("#game") as HTMLCanvasElement;
        const frames = new Set<string>();
        const start = performance.now();
        const sample = () => {
          if (c.dataset.animation === "run") frames.add(c.dataset.walkFrame!);
          if (frames.size === 8 || performance.now() - start > 5000)
            resolve([...frames]);
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  await page.keyboard.down("ArrowRight");
  expect((await observed).sort()).toEqual([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
  ]);
  await page.keyboard.up("ArrowRight");
  await page.getByRole("button", { name: "Pozastavit hru" }).click();
  await expect(
    page.getByRole("heading", { name: "Nelinka počká." }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const { drawNelinka } = await import(
      /* @vite-ignore */ "/nelinka-classic/nelinka.mjs"
    );
    const walk = new Image(),
      actions = new Image();
    walk.src = "/nelinka-classic/assets/nelinka-walk.png";
    actions.src = "/nelinka-classic/assets/nelinka-actions.png";
    await Promise.all([walk.decode(), actions.decode()]);
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 320;
    c.id = "nelinka-review";
    c.style.cssText =
      "position:fixed;top:0;left:0;width:1200px;height:320px;z-index:9999";
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f8f3d9";
    ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 12; i++) {
      const name = i < 8 ? "run" : ["idle", "jump", "fall", "bark"][i - 8];
      ctx.save();
      ctx.translate(75 + (i % 8) * 150, i < 8 ? 130 : 285);
      ctx.strokeStyle = "#cdd5b4";
      ctx.beginPath();
      ctx.moveTo(-70, 1);
      ctx.lineTo(70, 1);
      ctx.stroke();
      drawNelinka(ctx, { walk, actions }, name, i * 15);
      ctx.fillStyle = "#294c3d";
      ctx.font = "13px sans-serif";
      ctx.fillText(i < 8 ? `Krok ${i + 1}` : name, -25, 22);
      ctx.restore();
    }
    document.body.append(c);
  });
  await page
    .locator("#nelinka-review")
    .screenshot({ path: info.outputPath("nelinka-poses.png") });
});

test("hedgehog gait keeps its body stable and moves front and rear paws", async ({
  page,
}, info) => {
  await page.goto("/nelinka-classic");
  await expect(
    page.getByRole("button", { name: "Vyrazit do lesa" }),
  ).toBeEnabled();
  const samples = await page.evaluate(async () => {
    // Exercise the same renderer used in the game, at a fixed position so
    // differences in paw pixels cannot be explained by whole-body movement.
    const { drawQuadruped } = await import(
      /* @vite-ignore */ "/nelinka-classic/rig.mjs"
    );
    const gallery = document.createElement("canvas");
    gallery.width = 1200;
    gallery.height = 320;
    const galleryCtx = gallery.getContext("2d")!;
    galleryCtx.fillStyle = "#f8f3d9";
    galleryCtx.fillRect(0, 0, 1200, 320);
    const results = [];
    let row = 0;
    const style = "storybook";
    const sheet = new Image();
    sheet.src = `/nelinka-classic/assets/${style}-rig.png`;
    await sheet.decode();
    for (const kind of ["hedgehog"]) {
      const front = [],
        rear = [],
        heads = [];
      for (let frame = 0; frame < 8; frame++) {
        const c = document.createElement("canvas");
        c.width = 150;
        c.height = 160;
        const ctx = c.getContext("2d")!;
        ctx.translate(75, 140);
        drawQuadruped(
          ctx,
          sheet,
          kind,
          (frame / 8) * (kind === "puppy" ? 76 : 26),
        );
        const pixels = (x: number, y: number, w: number, h: number) =>
          Array.from(ctx.getImageData(x, y, w, h).data).join(",");
        heads.push(pixels(90, kind === "puppy" ? 55 : 95, 25, 20));
        front.push(pixels(78, 130, 45, 13));
        rear.push(pixels(30, 130, 45, 13));
        galleryCtx.drawImage(c, frame * 150, row * 160);
        galleryCtx.fillStyle = "#263f34";
        galleryCtx.font = "12px sans-serif";
        galleryCtx.fillText(
          `${style} ${kind} ${frame + 1}`,
          frame * 150 + 5,
          row * 160 + 18,
        );
      }
      results.push({
        style,
        kind,
        heads: new Set(heads).size,
        front: new Set(front).size,
        rear: new Set(rear).size,
      });
      row++;
    }
    document.body.replaceChildren(gallery);
    document.body.style.cssText = "margin:0;padding:0;display:block";
    gallery.id = "gait-review";
    return results;
  });
  for (const result of samples) {
    expect(result.heads, `${result.style} ${result.kind} stable head`).toBe(1);
    expect(
      result.front,
      `${result.style} ${result.kind} front paws`,
    ).toBeGreaterThan(3);
    expect(
      result.rear,
      `${result.style} ${result.kind} rear paws`,
    ).toBeGreaterThan(3);
  }
  await page
    .locator("#gait-review")
    .screenshot({ path: info.outputPath("gait-contact-sheet.png") });
});

test("platformer loads, animates running, jumping and barking, pauses and resumes", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/nelinka-classic");
  const canvas = page.locator("#game");
  await expect(
    page.getByRole("button", { name: "Vyrazit do lesa" }),
  ).toBeEnabled();
  await page.screenshot({
    path: info.outputPath("platformer-intro.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Vypnout zvuk" }).click();
  await page.getByRole("button", { name: "Vyrazit do lesa" }).click();
  await page.keyboard.down("ArrowRight");
  await expect(canvas).toHaveAttribute("data-animation", "run");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-x")), {
      intervals: [16],
    })
    .toBeGreaterThan(160);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("Space");
  await expect(canvas).toHaveAttribute("data-animation", "jump");
  await page.keyboard.up("Space");
  await page.keyboard.press("KeyE");
  await expect(canvas).toHaveAttribute("data-animation", "bark");
  await expect(canvas).toHaveAttribute("data-grounded", "true");
  await page.getByRole("button", { name: "Pozastavit hru" }).click();
  await expect(page.locator("#paused")).toBeVisible();
  const x = await canvas.getAttribute("data-x");
  await page.keyboard.press("ArrowRight");
  await expect(canvas).toHaveAttribute("data-x", x!);
  await page.getByRole("button", { name: "Pokračovat →", exact: true }).click();
  await expect(page.locator("#paused")).toBeHidden();
  await page.screenshot({
    path: info.outputPath("platformer-playing.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Nápověda", exact: true }).click();
  await expect(page.locator("#help-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Zavřít nápovědu" }).click();
  expect(errors).toEqual([]);
});

test("rescues the first duck through keyboard platforming and saves it across reload", async ({
  page,
}) => {
  await page.goto("/nelinka-classic");
  await page.getByRole("button", { name: "Vyrazit do lesa" }).click();
  const canvas = page.locator("#game");
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-x")), {
      intervals: [16],
    })
    .toBeGreaterThan(270);
  await page.keyboard.down("Space");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-x")), {
      intervals: [16],
    })
    .toBeGreaterThan(415);
  await page.keyboard.up("ArrowRight");
  await expect(canvas).toHaveAttribute("data-grounded", "true");
  await expect(canvas).toHaveAttribute("data-y", "614");
  await page.keyboard.up("Space");
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("Space");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-x")), {
      intervals: [16],
    })
    .toBeGreaterThan(680);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("Space");
  await expect(page.locator("#rescued")).toHaveText("1 / 3");
  await page.reload();
  await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
  await expect(page.locator("#rescued")).toHaveText("1 / 3");
});

test("small-screen layout exposes touch controls without horizontal overflow", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/nelinka-classic");
  await expect(
    page.getByRole("button", { name: "Vyrazit do lesa" }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("platformer-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Vyrazit do lesa" }).click();
  await expect(
    page.getByRole("button", { name: "Skočit", exact: true }),
  ).toBeInViewport();
  const right = page.getByRole("button", { name: "Jít vpravo" });
  const box = (await right.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.locator("#game")).toHaveAttribute("data-animation", "run");
  await page.mouse.up();
});

test("storybook replaces a saved painted preference and completion button stays centred", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("tlapkovy-art", "painted");
    localStorage.setItem(
      "tlapkovy-adventure-v2",
      JSON.stringify({
        version: 2,
        checkpoint: 3,
        rescued: [true, true, true],
        collected: [],
        key: true,
        gate: true,
        secret: true,
      }),
    );
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/nelinka-classic");
  await expect(
    page.getByRole("button", { name: "Vyrazit do lesa" }),
  ).toBeEnabled();
  await expect(page.locator("#art-style")).toHaveCount(0);
  await expect(page.locator("#game")).toHaveAttribute(
    "data-art-style",
    "storybook",
  );
  await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
  await page.keyboard.press("KeyE");
  await page.keyboard.down("ArrowRight");
  await expect(page.locator("#win")).toBeVisible({ timeout: 10_000 });
  await page.keyboard.up("ArrowRight");
  const card = (await page.locator("#win .card").boundingBox())!;
  const button = (await page.locator("#again").boundingBox())!;
  expect(
    Math.abs(button.x + button.width / 2 - (card.x + card.width / 2)),
  ).toBeLessThan(2);
  await page.screenshot({
    path: info.outputPath("platformer-win.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Zopakovat úroveň" }).click();
  await expect(page.locator("#rescued")).toHaveText("0 / 3");
});

test("storybook renders the mushroom and hedgehog at the checkpoint", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "tlapkovy-adventure-v2",
      JSON.stringify({
        version: 2,
        checkpoint: 1,
        rescued: [true, false, false],
        collected: [],
        key: false,
        gate: false,
        secret: false,
      }),
    ),
  );
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/nelinka-classic");
  await expect(
    page.getByRole("button", { name: "Vyrazit do lesa" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
  await expect(page.locator("#game")).toHaveAttribute("data-grounded", "true");
  await page.screenshot({
    path: info.outputPath("storybook-objects.png"),
    fullPage: true,
  });
});

test.describe("sharp rendering and mushroom impact", () => {
  test.use({ deviceScaleFactor: 2 });

  test("canvas matches physical display pixels while movement stays in world units", async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/nelinka-classic");
    await expect(
      page.getByRole("button", { name: "Vyrazit do lesa" }),
    ).toBeEnabled();
    const canvas = page.locator("#game");
    const resolutionMatches = () =>
      canvas.evaluate((element) => {
        const c = element as HTMLCanvasElement,
          bounds = c.getBoundingClientRect();
        return (
          c.width === Math.round(bounds.width * devicePixelRatio) &&
          c.height === Math.round(bounds.height * devicePixelRatio)
        );
      });
    await expect.poll(resolutionMatches).toBe(true);
    await page.getByRole("button", { name: "Vyrazit do lesa" }).click();
    await page.keyboard.down("ArrowRight");
    await expect(canvas).toHaveAttribute("data-animation", "run");
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-x")), {
        intervals: [16],
      })
      .toBeGreaterThan(180);
    await page.screenshot({
      path: info.outputPath("walking-hidpi.png"),
      fullPage: true,
    });
    await page.keyboard.up("ArrowRight");
    await page.setViewportSize({ width: 1100, height: 820 });
    await expect.poll(resolutionMatches).toBe(true);
    await expect(canvas).toHaveAttribute("data-y", "724");
  });

  test("mushroom squashes on impact, overshoots and settles", async ({
    page,
  }, info) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "tlapkovy-adventure-v2",
        JSON.stringify({
          version: 2,
          checkpoint: 1,
          rescued: [true, false, false],
          collected: [],
          key: false,
          gate: false,
          secret: false,
        }),
      ),
    );
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/nelinka-classic");
    await expect(
      page.getByRole("button", { name: "Vyrazit do lesa" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
    // Record actual rendered frames, so short impact phases cannot be missed
    // by assertion polling or screenshot capture latency.
    const motion = page.evaluate(
      () =>
        new Promise<number[]>((resolve, reject) => {
          const c = document.querySelector("#game") as HTMLCanvasElement;
          const samples: number[] = [];
          const start = performance.now();
          let impacted = false;
          function observe() {
            const scale = Number(c.dataset.springScale);
            samples.push(scale);
            if (scale < 0.9) impacted = true;
            // Software-rendered CI can take longer to reach the mushroom.
            // Finish on the actual simulation cycle, not a wall-clock guess.
            if (impacted && c.dataset.springPhase === "rest") resolve(samples);
            else if (performance.now() - start > 15000)
              reject(new Error("Mushroom impact did not complete"));
            else requestAnimationFrame(observe);
          }
          requestAnimationFrame(observe);
        }),
    );
    await page.keyboard.down("ArrowRight");
    await expect
      .poll(
        async () =>
          Number(await page.locator("#game").getAttribute("data-spring-scale")),
        { intervals: [16] },
      )
      .toBeLessThan(0.9);
    await page.keyboard.up("ArrowRight");
    await page.screenshot({
      path: info.outputPath("mushroom-impact.png"),
      fullPage: true,
    });
    const samples = await motion;
    expect(Math.min(...samples)).toBeLessThan(0.8);
    expect(Math.max(...samples)).toBeGreaterThan(1.08);
    expect(samples.at(-1)).toBe(1);
  });
});
