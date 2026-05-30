// Pure, dependency-free triangle-mesh generators plus a vertex→triangle
// adjacency table. No DOM and no GPU, so this runs unchanged in the browser
// island, in the build-time verify harness, and on the server.
//
// A mesh is the flat layout the GPU wants from the start: positions as three
// f32 per vertex, indices as three u32 per triangle. The CPU normals reference
// and the WebGPU buffers both consume these arrays byte-for-byte.

export interface Mesh {
  // 3 floats per vertex (x, y, z), tightly packed.
  positions: Float32Array;
  // 3 indices per triangle, into the vertex array.
  indices: Uint32Array;
}

export type MeshName = 'faceted' | 'icosphere' | 'torus';

// A flat (CSR-style) map from each vertex to the triangles that touch it.
// `adjStart` has vertexCount + 1 entries: the triangles for vertex v are
// `adjTris[adjStart[v] .. adjStart[v + 1]]`. The per-vertex GPU kernel walks
// exactly this slice, so it never races another invocation.
export interface Adjacency {
  adjStart: Uint32Array;
  adjTris: Uint32Array;
}

const PHI = (1 + Math.sqrt(5)) / 2;

// The 12 vertices and 20 faces of a regular icosahedron. Coarse enough that
// smooth per-vertex normals visibly round it, which is the whole point of the
// "faceted" default mesh.
function icosahedron(): Mesh {
  const raw = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ];
  const positions = new Float32Array(raw.length * 3);
  for (let i = 0; i < raw.length; i++) {
    // Normalize onto the unit sphere so the shape is centered and unit-scaled.
    const [x, y, z] = raw[i];
    const len = Math.hypot(x, y, z);
    positions[3 * i] = x / len;
    positions[3 * i + 1] = y / len;
    positions[3 * i + 2] = z / len;
  }
  const indices = new Uint32Array([
    0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
    1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
    3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
    4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
  ]);
  return { positions, indices };
}

// Subdivide the icosahedron `subdivisions` times and project every vertex onto
// the unit sphere. subdivisions = 0 is the bare icosahedron. Higher counts are
// the lever the bandwidth demo pulls to grow the vertex count.
export function icosphere(subdivisions = 2): Mesh {
  let { positions, indices } = icosahedron();
  let verts: number[] = Array.from(positions);

  for (let s = 0; s < subdivisions; s++) {
    const next: number[] = [];
    const midpoints = new Map<number, number>();

    const midpoint = (a: number, b: number): number => {
      const key = a < b ? a * 1e6 + b : b * 1e6 + a;
      const cached = midpoints.get(key);
      if (cached !== undefined) return cached;
      const mx = (verts[3 * a] + verts[3 * b]) / 2;
      const my = (verts[3 * a + 1] + verts[3 * b + 1]) / 2;
      const mz = (verts[3 * a + 2] + verts[3 * b + 2]) / 2;
      const len = Math.hypot(mx, my, mz);
      const index = verts.length / 3;
      verts.push(mx / len, my / len, mz / len);
      midpoints.set(key, index);
      return index;
    };

    for (let t = 0; t < indices.length; t += 3) {
      const a = indices[t];
      const b = indices[t + 1];
      const c = indices[t + 2];
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    indices = new Uint32Array(next);
  }

  return { positions: new Float32Array(verts), indices };
}

// A torus, parameterized by the ring radius and the tube radius. Curvature in
// two axes makes the normal-vector overlay fan out in an obvious way.
export function torus(
  radialSegments = 48,
  tubularSegments = 24,
  ringRadius = 0.7,
  tubeRadius = 0.3,
): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < radialSegments; i++) {
    const u = (i / radialSegments) * Math.PI * 2;
    for (let j = 0; j < tubularSegments; j++) {
      const v = (j / tubularSegments) * Math.PI * 2;
      const x = (ringRadius + tubeRadius * Math.cos(v)) * Math.cos(u);
      const y = (ringRadius + tubeRadius * Math.cos(v)) * Math.sin(u);
      const z = tubeRadius * Math.sin(v);
      positions.push(x, y, z);
    }
  }

  for (let i = 0; i < radialSegments; i++) {
    for (let j = 0; j < tubularSegments; j++) {
      const a = i * tubularSegments + j;
      const b = ((i + 1) % radialSegments) * tubularSegments + j;
      const c = ((i + 1) % radialSegments) * tubularSegments + ((j + 1) % tubularSegments);
      const d = i * tubularSegments + ((j + 1) % tubularSegments);
      indices.push(a, b, d, b, c, d);
    }
  }

  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

export function makeMesh(name: MeshName, subdivisions = 3): Mesh {
  switch (name) {
    case 'faceted':
      return icosphere(0);
    case 'torus':
      return torus();
    case 'icosphere':
    default:
      return icosphere(subdivisions);
  }
}

// Build the vertex→triangle adjacency in CSR layout: count how many triangles
// touch each vertex, prefix-sum those counts into offsets, then scatter each
// triangle into the three slots its vertices reserved.
export function buildAdjacency(mesh: Mesh): Adjacency {
  const vertexCount = mesh.positions.length / 3;
  const triangleCount = mesh.indices.length / 3;
  const counts = new Uint32Array(vertexCount);

  for (let i = 0; i < mesh.indices.length; i++) {
    counts[mesh.indices[i]]++;
  }

  const adjStart = new Uint32Array(vertexCount + 1);
  for (let v = 0; v < vertexCount; v++) {
    adjStart[v + 1] = adjStart[v] + counts[v];
  }

  const cursor = adjStart.slice(0, vertexCount);
  const adjTris = new Uint32Array(adjStart[vertexCount]);
  for (let t = 0; t < triangleCount; t++) {
    for (let k = 0; k < 3; k++) {
      const v = mesh.indices[3 * t + k];
      adjTris[cursor[v]++] = t;
    }
  }

  return { adjStart, adjTris };
}
