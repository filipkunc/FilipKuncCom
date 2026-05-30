// Runs the exact CPU reference the post shows, on the exact mesh generator the
// demo uses, so the snippet in the post is proven to work at build time. The
// WebGPU compute shader is the twin of this function, so a passing CPU run
// stands in for both. `npm run verify` captures the output below.
import { icosphere } from '../../../../../lib/gpu-normals/mesh.ts';
import { computeVertexNormals } from '../../../../../lib/gpu-normals/cpu-normals.ts';

// #region harness
// The bare icosahedron: 12 vertices, 20 faces, every vertex on the unit sphere.
const mesh = icosphere(0);
const vertexCount = mesh.positions.length / 3;
const triangleCount = mesh.indices.length / 3;
console.log(`mesh: ${vertexCount} vertices, ${triangleCount} triangles`);

const normals = computeVertexNormals(mesh.positions, mesh.indices);

// Every vertex normal should come out unit length.
let maxLenError = 0;
for (let v = 0; v < normals.length; v += 3) {
  const len = Math.hypot(normals[v], normals[v + 1], normals[v + 2]);
  maxLenError = Math.max(maxLenError, Math.abs(len - 1));
}
console.log(`all normals unit length: ${maxLenError < 1e-6} (max error ${maxLenError.toExponential(1)})`);

// On a sphere sampled symmetrically, each vertex normal points the same way as
// the vertex itself. So the computed normal should match the normalized
// position. This is the invariant that tells us the averaging is right.
let maxDirError = 0;
for (let v = 0; v < normals.length; v += 3) {
  const len = Math.hypot(mesh.positions[v], mesh.positions[v + 1], mesh.positions[v + 2]);
  for (let k = 0; k < 3; k++) {
    maxDirError = Math.max(maxDirError, Math.abs(normals[v + k] - mesh.positions[v + k] / len));
  }
}
console.log(`normals match normalized position: ${maxDirError < 1e-6} (max error ${maxDirError.toExponential(1)})`);

// Show the first three, rounded so the output is stable across machines.
const round = (x: number) => (Math.abs(x) < 1e-7 ? 0 : Number(x.toFixed(4)));
for (let v = 0; v < 3; v++) {
  const i = v * 3;
  console.log(`  normal[${v}] = (${round(normals[i])}, ${round(normals[i + 1])}, ${round(normals[i + 2])})`);
}
// #endregion harness
