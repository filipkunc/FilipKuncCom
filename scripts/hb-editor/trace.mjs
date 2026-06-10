// Captures a Chrome trace (Perfetto-compatible) while the compare page
// redraws both pipelines, then prints a summary of GPU-process work.
//
//   node scripts/hb-editor/trace.mjs [--frames 120] [--out /tmp/hb-trace.json] [--hw] [--panes hb|c2d|dom]
//
// Default runs headless on SwiftShader (CI-safe, plumbing check only).
// --hw launches a visible window on the real GPU — use that for numbers
// worth publishing.
// --panes isolates one pipeline; DOM tiles and canvas 2D share the
// RasterDecoder path in traces, so trace them separately to attribute work:
//   trace.mjs --hw --panes hb   → WebGL events are ours, raster ~idle
//   trace.mjs --hw --panes c2d  → RasterDecoder work is canvas 2D
//   trace.mjs --hw --panes dom  → RasterDecoder work is DOM tile raster
//
// Open the output in https://ui.perfetto.dev to inspect: our WebGL draws and
// canvas 2D's Skia raster/atlas work both run in the GPU process, which is
// invisible to in-page JS timers. This is the honest GPU-side picture.
import { writeFile } from 'node:fs/promises';
import { startServer } from './serve.mjs';

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : dflt;
};
const FRAMES = Number(flag('frames', 120));
const OUT = flag('out', '/tmp/hb-trace.json');
const HW = args.includes('--hw');
const PANES = flag('panes', '');
const PORT = 4799;

const CATEGORIES = [
  'gpu',
  'gpu.service',
  'viz',
  'cc',
  'blink',
  'blink.user_timing',
  'disabled-by-default-gpu.service',
];

const { chromium } = await import('@playwright/test');
const server = await startServer(PORT);
const browser = await chromium.launch({
  channel: 'chromium',
  // --hw: headed on the real GPU driver; otherwise headless SwiftShader.
  headless: !HW,
  args: HW ? [] : ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});
const context = await browser.newContext();
const page = await context.newPage();
const paneQuery = PANES ? `?panes=${PANES}` : '';
await page.goto(`http://127.0.0.1:${PORT}/web/compare/${paneQuery}`);
await page.waitForFunction(() => window.__cmpReady === true);

// Quiet the page UI: the status line rewrites and input repaints would
// otherwise re-raster every frame and pollute the GPU-process baseline in
// ALL pane modes (display:none elements don't paint or raster).
await page.evaluate(() => {
  for (const el of document.querySelectorAll('h1, p, .row, #status')) {
    el.style.display = 'none';
  }
});

const cdp = await context.newCDPSession(page);
await cdp.send('Tracing.start', {
  traceConfig: {
    includedCategories: CATEGORIES,
    recordMode: 'recordUntilFull',
  },
  transferMode: 'ReturnAsStream',
});

// Workload: per frame, redraw both pipelines with slightly changing text so
// shaping and canvas glyph lookups actually run (fixed text would test only
// caches). User-timing marks delimit the workload in the trace.
await page.evaluate(async (frames) => {
  const sleep = () => new Promise(requestAnimationFrame);
  performance.mark('workload-start');
  const input = document.getElementById('text');
  const base = input.value;
  for (let i = 0; i < frames; i++) {
    input.value = `${base} ${i}`;
    performance.mark('frame-start');
    await window.__cmp.draw();
    performance.measure(`frame-${i}`, 'frame-start');
    await sleep();
  }
  performance.measure('workload', 'workload-start');
}, FRAMES);

const done = new Promise((resolve) => {
  cdp.on('Tracing.tracingComplete', (e) => resolve(e.stream));
});
await cdp.send('Tracing.end');
const stream = await done;

let trace = '';
for (;;) {
  const { data, eof } = await cdp.send('IO.read', { handle: stream });
  trace += data;
  if (eof) break;
}
await cdp.send('IO.close', { handle: stream });
await browser.close();
server.close();
await writeFile(OUT, trace);

// --- Summary: total wall time per event name in the GPU process. ---
const json = JSON.parse(trace);
const events = json.traceEvents ?? json;
const gpuPids = new Set(
  events
    .filter((e) => e.name === 'process_name' && /GPU/i.test(e.args?.name ?? ''))
    .map((e) => e.pid),
);
const byName = new Map();
for (const e of events) {
  if (!gpuPids.has(e.pid) || e.ph !== 'X' || !e.dur) continue;
  const agg = byName.get(e.name) ?? { count: 0, totalUs: 0 };
  agg.count++;
  agg.totalUs += e.dur;
  byName.set(e.name, agg);
}
const top = [...byName.entries()]
  .sort((a, b) => b[1].totalUs - a[1].totalUs)
  .slice(0, 18);

console.log(
  `Trace written: ${OUT} (${(trace.length / 1e6).toFixed(1)} MB, ${FRAMES} frames, ` +
  `panes: ${PANES || 'all'}, ` +
  `${HW ? 'hardware GPU' : 'SwiftShader — plumbing check only, pass --hw for real numbers'})`,
);
console.log(`Open in https://ui.perfetto.dev\n`);
console.log('GPU-process events by total duration:');
for (const [name, { count, totalUs }] of top) {
  console.log(
    `  ${(totalUs / 1000).toFixed(1).padStart(8)} ms  ${String(count).padStart(6)}x  ${name}`,
  );
}
