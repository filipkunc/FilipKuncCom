// A cloth is just a regular grid of particles. The geometry never changes
// topology, only positions, so the index buffer and the vertex→triangle
// adjacency (which the normals kernel walks) are built once. This is the input
// both the GPU simulation and the CPU comparison consume.

import { buildAdjacency, type Mesh, type Adjacency } from '../gpu-normals/mesh';

export interface ClothGrid {
  cols: number;
  rows: number;
  vertexCount: number;
  triangleCount: number;
  // 3 floats per particle, laid out row-major (r * cols + c).
  positions: Float32Array;
  // 6 indices per quad.
  indices: Uint32Array;
  adjacency: Adjacency;
  // Rest spacing between neighbours along x and y.
  restX: number;
  restY: number;
}

// Build a cloth hanging in the XY plane: the top row sits at y = +height/2 and
// is the row the simulation pins. A sub-millimetre z ripple breaks the perfect
// plane so it falls into folds instead of staying a flat sheet.
export function makeClothGrid(cols: number, rows: number, width = 2.6, height = 1.7): ClothGrid {
  const positions = new Float32Array(cols * rows * 3);
  const restX = width / (cols - 1);
  const restY = height / (rows - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 3;
      positions[i] = -width / 2 + c * restX;
      positions[i + 1] = height / 2 - r * restY;
      // A tiny deterministic ripple, no Math.random so it stays reproducible.
      positions[i + 2] = Math.sin(c * 0.7) * Math.cos(r * 0.7) * 0.002;
    }
  }

  const indices = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let k = 0;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const tl = r * cols + c;
      const tr = tl + 1;
      const bl = tl + cols;
      const br = bl + 1;
      // Two triangles per quad, wound so the front face points toward +z.
      indices[k++] = tl; indices[k++] = bl; indices[k++] = tr;
      indices[k++] = tr; indices[k++] = bl; indices[k++] = br;
    }
  }

  const mesh: Mesh = { positions, indices };
  return {
    cols,
    rows,
    vertexCount: cols * rows,
    triangleCount: indices.length / 3,
    positions,
    indices,
    adjacency: buildAdjacency(mesh),
    restX,
    restY,
  };
}

// Map a small set of "detail" steps to square grid sizes, so the UI slider has
// a handful of meaningful stops rather than an awkward continuous range. The
// triangle count is roughly 2 * (n - 1)^2.
export const GRID_STEPS = [128, 256, 354, 512, 724] as const; // ~32k, 130k, 250k, 523k, 1.05M tris

export function trianglesFor(n: number): number {
  return (n - 1) * (n - 1) * 2;
}
