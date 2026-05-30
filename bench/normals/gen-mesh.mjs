// Writes the shared benchmark mesh that every language runner reads, so they
// all compute normals for the exact same geometry and their checksums must
// match. Self-contained (no project imports) so the benchmark is trivial to
// reproduce on its own.
//
// Binary layout (little-endian):
//   u32  vertexCount V
//   u32  triangleCount T
//   f32  positions[3V]
//   u32  indices[3T]
//   u32  adjStart[V+1]
//   u32  adjTris[3T]      (vertex -> incident triangle, CSR)

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// 512 x 512 ~ 262k vertices, 522k triangles.
const N = 512;
const V = N * N;
const T = (N - 1) * (N - 1) * 2;
const width = 2;
const height = 2;
const restX = width / (N - 1);
const restY = height / (N - 1);

const positions = new Float32Array(3 * V);
for (let r = 0; r < N; r++) {
  for (let c = 0; c < N; c++) {
    const i = (r * N + c) * 3;
    const x = -width / 2 + c * restX;
    const y = height / 2 - r * restY;
    positions[i] = x;
    positions[i + 1] = y;
    // A fixed bulge so the normals are non-trivial (not all +z).
    positions[i + 2] = 0.25 * Math.sin(x * 3.1) * Math.cos(y * 2.7);
  }
}

const indices = new Uint32Array(T * 3);
let k = 0;
for (let r = 0; r < N - 1; r++) {
  for (let c = 0; c < N - 1; c++) {
    const tl = r * N + c;
    const tr = tl + 1;
    const bl = tl + N;
    const br = bl + 1;
    indices[k++] = tl; indices[k++] = bl; indices[k++] = tr;
    indices[k++] = tr; indices[k++] = bl; indices[k++] = br;
  }
}

// CSR vertex -> incident triangles.
const counts = new Uint32Array(V);
for (let i = 0; i < indices.length; i++) counts[indices[i]]++;
const adjStart = new Uint32Array(V + 1);
for (let v = 0; v < V; v++) adjStart[v + 1] = adjStart[v] + counts[v];
const cursor = adjStart.slice(0, V);
const adjTris = new Uint32Array(adjStart[V]);
for (let t = 0; t < T; t++) {
  for (let j = 0; j < 3; j++) {
    const v = indices[3 * t + j];
    adjTris[cursor[v]++] = t;
  }
}

const header = new Uint32Array([V, T]);
const out = join(here, 'mesh.bin');
writeFileSync(
  out,
  Buffer.concat([
    Buffer.from(header.buffer),
    Buffer.from(positions.buffer),
    Buffer.from(indices.buffer),
    Buffer.from(adjStart.buffer),
    Buffer.from(adjTris.buffer),
  ]),
);
console.log(`wrote ${out}: ${V} vertices, ${T} triangles`);
