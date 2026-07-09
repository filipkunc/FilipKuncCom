// Measure embed heights: initial (pre) -> ready (editor) -> playing (viz+sliders)
import { chromium } from "@playwright/test";
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
await page.goto("http://localhost:4321/posts/one-track-in-strudel", { waitUntil: "domcontentloaded" });
const h = (i) => page.evaluate((i) => document.querySelectorAll(".strudel")[i].offsetHeight, i);
const initial = [];
for (let i = 0; i < 5; i++) initial.push(await h(i));
// wait for lazy engine init on visible embeds (scroll through page)
for (let y = 0; ; y += 400) {
  const done = await page.evaluate((y) => { window.scrollTo(0, y); return y >= document.body.scrollHeight; }, y);
  await page.waitForTimeout(120);
  if (done) break;
}
await page.evaluate(() => window.scrollTo(0, 0));
try {
  await page.waitForFunction(() => document.querySelectorAll(".strudel.ready").length === 5, undefined, { timeout: 60_000 });
} catch (e) {
  const n = await page.evaluate(() => document.querySelectorAll(".strudel.ready").length);
  console.log("ready count after timeout:", n);
  throw e;
}
const ready = [];
for (let i = 0; i < 5; i++) ready.push(await h(i));
// play the arp embed (has 3 sliders) and check slider line height + height
const fig = page.locator(".strudel").nth(4);
await fig.locator(".s-play").click();
await page.waitForTimeout(6000);
const playing = await h(4);
const sliderLine = await page.evaluate(() => {
  const inp = document.querySelector(".strudel input[type=range]");
  return { lineH: inp?.closest(".cm-line")?.offsetHeight, normal: document.querySelector(".strudel .cm-line")?.offsetHeight };
});
console.log("initial (pre):", initial);
console.log("ready (editor):", ready);
console.log("delta pre->editor:", initial.map((v, i) => ready[i] - v));
console.log("arp embed after play:", playing, "(was", ready[4], "+ viz 140 expected)");
console.log("slider line height:", sliderLine);
await browser.close();
