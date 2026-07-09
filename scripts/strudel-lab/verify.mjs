// Headless check: engine loads, every chip evaluates without Strudel errors.
// Strudel logs runtime errors via console.log (styled %c), NOT console.error,
// so we capture ALL console text and grep. Headless Chromium has no audio
// device, which throws a spurious AudioWorkletNode error we ignore.
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const server = createServer(async (req, res) => {
  try {
    const data = await readFile(join(dir, "index.html"));
    res.writeHead(200, { "content-type": "text/html" });
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();

const logs = [];
page.on("console", msg => logs.push(msg.text()));
page.on("pageerror", err => logs.push(`PAGEERROR: ${err.message}`));

const isRealError = t =>
  /error|invalid|not found/i.test(t) &&
  !/AudioWorkletNode/.test(t) && // headless-only, no audio device
  !/font/i.test(t);

await page.goto(url);
await page.waitForFunction(
  () => document.getElementById("status")?.textContent === "ready",
  { timeout: 60_000 },
);
console.log("engine ready");

const chips = await page.locator(".chip").all();
let failed = 0;
for (const chip of chips) {
  const label = await chip.getAttribute("data-chip");
  logs.length = 0;
  await chip.click();
  await page.waitForTimeout(3500); // let samples fetch + a cycle or two query
  const errs = logs.filter(isRealError);
  if (errs.length) {
    failed++;
    console.log(`FAIL ${label}`);
    for (const e of errs.slice(0, 4)) console.log(`   ${e.slice(0, 200)}`);
  } else {
    console.log(`ok   ${label}`);
  }
  await page.locator("#btn-stop").click();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} chip(s) failed` : "\nall chips clean");
process.exit(failed ? 1 : 0);
