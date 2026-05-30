// CPU baseline: the same reference function the post teaches, timed over the
// shared mesh. Prints a RESULT line the driver parses.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeVertexNormals } from '../../src/lib/gpu-normals/cpu-normals.ts';

const here = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(here, 'mesh.bin'));
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const V = dv.getUint32(0, true);
const T = dv.getUint32(4, true);
let off = 8;
const positions = new Float32Array(buf.buffer, buf.byteOffset + off, 3 * V);
off += 3 * V * 4;
const indices = new Uint32Array(buf.buffer, buf.byteOffset + off, 3 * T);

const ITERS = 30;
let best = Infinity;
let normals;
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  normals = computeVertexNormals(positions, indices);
  best = Math.min(best, performance.now() - t0);
}

// Double-precision checksum over the float normals: identical normals across
// languages give the same number, so it doubles as a correctness check.
let checksum = 0;
for (let v = 0; v < V; v++) {
  checksum += normals[3 * v] + 2 * normals[3 * v + 1] + 3 * normals[3 * v + 2];
}

console.log(
  `RESULT lang=js device="CPU (single thread, JS)" vertices=${V} triangles=${T} ms=${best.toFixed(3)} checksum=${checksum.toFixed(4)}`,
);
