import { test, expect } from "@playwright/test";

test("later levels run mixed enemy patrols; frogs telegraph and hop", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "tlapkovy-adventure-v3",
      JSON.stringify({ version: 3, level: 1 }),
    ),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/nelinka");
  await page.getByRole("button", { name: "Pokračovat ve výpravě" }).click();
  const canvas = page.locator("#game");
  expect((await canvas.getAttribute("data-enemies"))!.split(",")).toHaveLength(
    6,
  );
  await expect(canvas).toHaveAttribute("data-enemies", /frog:crouch/);
  await expect(canvas).toHaveAttribute("data-enemies", /frog:hop/);
  await expect(canvas).toHaveAttribute("data-enemies", /bee:/);
  // Approach the first ground patrol and use the real E-key interaction.
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(
    () =>
      Number(document.querySelector<HTMLCanvasElement>("#game")!.dataset.x) >
      740,
  );
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("e");
  await expect(canvas).toHaveAttribute(
    "data-enemies",
    /frog:asleep|hedgehog:asleep/,
  );
  await canvas.screenshot({ path: info.outputPath("grove-patrols.png") });
  expect(errors).toEqual([]);
});

test("frog and bee animation poses stay crisp and visually distinct", async ({
  page,
}, info) => {
  await page.goto("/nelinka");
  await expect(
    page.getByRole("button", { name: "Vyrazit do lesa" }),
  ).toBeEnabled();
  const variation = await page.evaluate(async () => {
    const { createEnemy, drawForestEnemy } = await import(
      /* @vite-ignore */ "/nelinka/enemies.mjs"
    );
    const c = document.createElement("canvas");
    c.id = "enemy-review";
    c.width = 1000;
    c.height = 340;
    c.style.cssText =
      "position:fixed;top:0;left:0;z-index:9999;width:1000px;height:340px";
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fcf6df";
    ctx.fillRect(0, 0, c.width, c.height);
    const variants = [];
    for (const [row, kind] of ["frog", "bee"].entries()) {
      const hashes = [];
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(100 + i * 200, 125 + row * 170);
        ctx.scale(2, 2);
        const e = createEnemy({ kind, x: 0, y: 0, dir: 1, min: -20, max: 20 });
        Object.assign(e, {
          phase: ["wait", "crouch", "hop", "hop", "wait"][i],
          vy: i === 2 ? -200 : 200,
          clock: i * 0.037,
          asleep: i === 4 ? 1 : 0,
        });
        drawForestEnemy(ctx, e);
        ctx.restore();
        hashes.push(
          Array.from(ctx.getImageData(i * 200, row * 170, 200, 140).data).join(
            ",",
          ),
        );
        ctx.fillStyle = "#385441";
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          kind === "frog"
            ? ["Čeká", "Přikrčí se", "Odraz", "Přistává", "Dřímá"][i]
            : i === 4
              ? "Dřímá"
              : `Let ${i + 1}`,
          100 + i * 200,
          154 + row * 170,
        );
      }
      variants.push(new Set(hashes).size);
    }
    document.body.append(c);
    return variants;
  });
  expect(variation[0]).toBeGreaterThanOrEqual(4);
  expect(variation[1]).toBe(5);
  await page
    .locator("#enemy-review")
    .screenshot({ path: info.outputPath("frog-and-bee-poses.png") });
});
