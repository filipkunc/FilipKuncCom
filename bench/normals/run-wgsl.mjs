// WGSL runner: runs the post's actual normals compute shader through headless
// Chromium, on the real GPU when one is reachable and SwiftShader otherwise.
// The mesh is served over a local socket and fetched in the page (16 MB is too
// much to pass through evaluate()). GPU time comes from timestamp queries.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'node:http';

const here = dirname(fileURLToPath(import.meta.url));
const meshBytes = readFileSync(join(here, 'mesh.bin'));
const wgsl = readFileSync(join(here, '../../src/lib/gpu-normals/shaders/normals.compute.wgsl'), 'utf8');

// Tiny static server: an HTML shell at / (a real localhost secure context) and
// the mesh at /mesh.bin.
const server = createServer((req, res) => {
  if (req.url === '/mesh.bin') {
    res.writeHead(200, { 'content-type': 'application/octet-stream' });
    res.end(meshBytes);
  } else {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<!doctype html><meta charset=utf8><title>bench</title>');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const BASE_ARGS = ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU'];
const SOFTWARE_ARGS = [...BASE_ARGS, '--enable-unsafe-swiftshader', '--use-vulkan=swiftshader', '--use-angle=swiftshader'];

async function runWith(args, headless) {
  const browser = await chromium.launch({ headless, channel: 'chromium', args });
  try {
    const page = await browser.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    const out = await page.evaluate(async ({ wgsl }) => {
      if (!navigator.gpu) return { error: 'no navigator.gpu' };
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) return { error: 'no adapter' };
      const canTime = adapter.features.has('timestamp-query');
      const device = await adapter.requestDevice({ requiredFeatures: canTime ? ['timestamp-query'] : [] });

      const buf = await (await fetch('/mesh.bin')).arrayBuffer();
      const dv = new DataView(buf);
      const V = dv.getUint32(0, true), T = dv.getUint32(4, true);
      let off = 8;
      const positions = new Float32Array(buf, off, 3 * V); off += 3 * V * 4;
      const indices = new Uint32Array(buf, off, 3 * T); off += 3 * T * 4;
      const adjStart = new Uint32Array(buf, off, V + 1); off += (V + 1) * 4;
      const adjTris = new Uint32Array(buf, off, 3 * T);

      const mk = (data, usage) => {
        const b = device.createBuffer({ size: data.byteLength, usage });
        device.queue.writeBuffer(b, 0, data);
        return b;
      };
      const S = GPUBufferUsage.STORAGE, U = GPUBufferUsage.UNIFORM, CD = GPUBufferUsage.COPY_DST, CS = GPUBufferUsage.COPY_SRC, MR = GPUBufferUsage.MAP_READ;
      const posB = mk(positions, S | CD);
      const idxB = mk(indices, S | CD);
      const startB = mk(adjStart, S | CD);
      const trisB = mk(adjTris, S | CD);
      const normB = device.createBuffer({ size: 3 * V * 4, usage: S | CS });
      const countsB = mk(new Uint32Array([V, T, 0, 0]), U | CD);

      const module = device.createShaderModule({ code: wgsl });
      const pipeline = await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'main' } });
      const bind = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: posB } },
          { binding: 1, resource: { buffer: idxB } },
          { binding: 2, resource: { buffer: startB } },
          { binding: 3, resource: { buffer: trisB } },
          { binding: 4, resource: { buffer: normB } },
          { binding: 5, resource: { buffer: countsB } },
        ],
      });
      const groups = Math.ceil(V / 64);

      const querySet = canTime ? device.createQuerySet({ type: 'timestamp', count: 2 }) : null;
      const resolve = canTime ? device.createBuffer({ size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC }) : null;
      const qread = canTime ? device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }) : null;

      const dispatch = () => {
        const enc = device.createCommandEncoder();
        const pass = enc.beginComputePass(
          canTime ? { timestampWrites: { querySet, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 } } : {},
        );
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bind);
        pass.dispatchWorkgroups(groups);
        pass.end();
        if (canTime) { enc.resolveQuerySet(querySet, 0, 2, resolve, 0); enc.copyBufferToBuffer(resolve, 0, qread, 0, 16); }
        device.queue.submit([enc.finish()]);
        return enc;
      };

      // Warm up.
      for (let i = 0; i < 5; i++) dispatch();
      await device.queue.onSubmittedWorkDone();

      let best = Infinity;
      for (let i = 0; i < 200; i++) {
        if (canTime) {
          dispatch();
          await qread.mapAsync(GPUMapMode.READ);
          const t = new BigUint64Array(qread.getMappedRange().slice(0));
          qread.unmap();
          const ms = Number(t[1] - t[0]) / 1e6;
          if (ms > 0 && ms < best) best = ms;
        } else {
          const t0 = performance.now();
          dispatch();
          await device.queue.onSubmittedWorkDone();
          best = Math.min(best, performance.now() - t0);
        }
      }

      // Read normals back for the checksum.
      const rb = device.createBuffer({ size: 3 * V * 4, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      const enc = device.createCommandEncoder();
      enc.copyBufferToBuffer(normB, 0, rb, 0, 3 * V * 4);
      device.queue.submit([enc.finish()]);
      await rb.mapAsync(GPUMapMode.READ);
      const normals = new Float32Array(rb.getMappedRange().slice(0));
      rb.unmap();
      let checksum = 0;
      for (let v = 0; v < V; v++) checksum += normals[3 * v] + 2 * normals[3 * v + 1] + 3 * normals[3 * v + 2];

      const info = adapter.info || {};
      // WebGPU masks the specific device model for privacy: when `device` and
      // `description` are empty we only have vendor + architecture. Report
      // exactly what the API gives, and flag that it is masked.
      const full = info.description || info.device || '';
      const device_name = full || `${info.vendor || 'webgpu'} ${info.architecture || ''}`.trim();
      return { V, T, ms: best, checksum, device: device_name, timed: canTime, masked: !full };
    }, { wgsl });
    return { ...out, errs };
  } finally {
    await browser.close();
  }
}

// Chromium can only reach a hardware WebGPU adapter on Linux when it has a
// display, so prefer a headed launch when one is available; fall back to
// headless, then to software SwiftShader, so the bench always produces a number.
const haveDisplay = !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
let result;
if (haveDisplay) result = await runWith(BASE_ARGS, false);
if (!result || result.error) result = await runWith(BASE_ARGS, true);
if (result.error) result = await runWith(SOFTWARE_ARGS, true);
server.close();

if (result.error) {
  console.error(`wgsl runner failed: ${result.error}`);
  process.exit(1);
}
const label = result.device + (result.timed ? '' : ' (wall clock)');
console.log(
  `RESULT lang=wgsl device="${label}" masked=${result.masked ? 1 : 0} vertices=${result.V} triangles=${result.T} ms=${result.ms.toFixed(3)} checksum=${result.checksum.toFixed(4)}`,
);
