// The reference per-vertex normal computation, on the CPU, in plain TypeScript.
// This is the twin of the WebGPU compute shader: identical math (an
// area-weighted average of the incident face normals), different traversal.
// The CPU walks triangles and scatters into vertices; the GPU walks vertices
// and gathers their triangles. Both are kept in Float32Array so their rounding
// matches and the demo's "max delta" readout stays honest.

import type { Mesh } from './mesh';

// #region accumulate
export function computeVertexNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length); // zero-initialized

  // Walk every triangle once. Its face normal is the cross product of two
  // edges. We leave it un-normalized on purpose: the cross product's length is
  // twice the triangle's area, so longer faces pull their shared vertices more.
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3;
    const b = indices[t + 1] * 3;
    const c = indices[t + 2] * 3;

    const e1x = positions[b] - positions[a];
    const e1y = positions[b + 1] - positions[a + 1];
    const e1z = positions[b + 2] - positions[a + 2];
    const e2x = positions[c] - positions[a];
    const e2y = positions[c + 1] - positions[a + 1];
    const e2z = positions[c + 2] - positions[a + 2];

    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    // Scatter: add this face's normal to all three of its vertices.
    normals[a] += nx; normals[a + 1] += ny; normals[a + 2] += nz;
    normals[b] += nx; normals[b + 1] += ny; normals[b + 2] += nz;
    normals[c] += nx; normals[c + 1] += ny; normals[c + 2] += nz;
  }

  // Normalize each accumulated vertex normal back to unit length.
  for (let v = 0; v < normals.length; v += 3) {
    const len = Math.hypot(normals[v], normals[v + 1], normals[v + 2]);
    if (len > 0) {
      normals[v] /= len;
      normals[v + 1] /= len;
      normals[v + 2] /= len;
    }
  }

  return normals;
}
// #endregion accumulate

export function computeMeshNormals(mesh: Mesh): Float32Array {
  return computeVertexNormals(mesh.positions, mesh.indices);
}
