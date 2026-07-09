// Drive the post page: play each embed, check console, viz adoption, sliders,
// and that the engine loads from the local vendored file (not a CDN).
import { chromium } from "@playwright/test";

const POST_URL = process.env.POST_URL || "http://localhost:4321/posts/one-track-in-strudel";
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
const logs = [];
const requests = [];
page.on("console", m => logs.push(m.text()));
page.on("pageerror", e => logs.push(`PAGEERROR: ${e.message}`));
page.on("request", r => requests.push(r.url()));

await page.goto(POST_URL);
const figures = await page.locator(".strudel").count();
console.log("embeds found:", figures);

let failed = 0;
for (let i = 0; i < figures; i++) {
  logs.length = 0;
  const fig = page.locator(".strudel").nth(i);
  await fig.locator(".s-play").click();
  await page.waitForTimeout(6000); // engine + soundfonts on first play
  const state = await fig.evaluate((el) => {
    const slot = el.querySelector(".s-viz");
    const canvas = slot?.querySelector("canvas");
    let vizDrawn = null;
    if (canvas) {
      // the solo-mode regression left the canvas adopted but never painted,
      // so check actual pixels, not just adoption
      const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let n = 0;
      for (let p = 3; p < d.length; p += 40) if (d[p] !== 0) n++;
      vizDrawn = n > 100;
    }
    return {
      playing: el.classList.contains("playing"),
      vizVisible: slot ? slot.offsetHeight > 0 : null,
      canvasAdopted: !!canvas,
      vizDrawn,
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : null,
      sliders: el.querySelectorAll("input[type=range], [class*=slider]").length,
      editorVisible: !!el.querySelector(".cm-editor"),
    };
  });
  const errs = logs.filter(t =>
    /error|invalid|not found/i.test(t) && !/AudioWorkletNode/.test(t) && !/font/i.test(t));
  const ok = state.playing && state.canvasAdopted && state.vizDrawn !== false
    && state.editorVisible && errs.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} embed ${i}:`, JSON.stringify(state));
  for (const e of errs.slice(0, 3)) console.log("   ", e.slice(0, 180));
  await fig.locator(".s-stop").click();
}

const siteHost = new URL(POST_URL).host;
const engineReqs = requests.filter(u => /strudel.*repl|repl\.js/i.test(u));
const cdnEngine = engineReqs.filter(u => new URL(u).host !== siteHost);
console.log("\nengine requests:", engineReqs);
console.log(cdnEngine.length ? "FAIL: engine from CDN" : "engine served from the site: ok");
const external = [...new Set(requests.filter(u => new URL(u).host !== siteHost).map(u => new URL(u).host))];
console.log("external hosts (samples etc.):", external);

await browser.close();
process.exit(failed || cdnEngine.length ? 1 : 0);
