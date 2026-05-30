// Per-vertex smooth normals, computed on the GPU's compute pipeline.
//
// The obvious port of the CPU code would scatter each face normal into its
// three vertices. On the GPU that is a data race: many triangles write the
// same vertex at once. WGSL has no atomics on f32, so the float-add workaround
// would mean integer-encoding every component and decoding in a second pass.
// Instead we flip the loop: one invocation per vertex gathers the triangles
// that touch it. Each thread owns one output slot, so there is no contention.

// #region bindings
struct Counts {
  vertexCount : u32,
  triangleCount : u32,
};

@group(0) @binding(0) var<storage, read>       positions : array<f32>;
@group(0) @binding(1) var<storage, read>       indices   : array<u32>;
@group(0) @binding(2) var<storage, read>       adjStart  : array<u32>;
@group(0) @binding(3) var<storage, read>       adjTris   : array<u32>;
@group(0) @binding(4) var<storage, read_write> normals   : array<f32>;
@group(0) @binding(5) var<uniform>             counts    : Counts;
// #endregion bindings

fn position(i : u32) -> vec3<f32> {
  return vec3<f32>(positions[3u * i], positions[3u * i + 1u], positions[3u * i + 2u]);
}

// #region face-normal
// Area-weighted face normal: cross(edge1, edge2) is perpendicular to the face
// and its length is twice the triangle area, so it doubles as the weight.
fn faceNormal(t : u32) -> vec3<f32> {
  let a = position(indices[3u * t]);
  let b = position(indices[3u * t + 1u]);
  let c = position(indices[3u * t + 2u]);
  return cross(b - a, c - a);
}
// #endregion face-normal

// #region gather
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let v = gid.x;
  if (v >= counts.vertexCount) { return; }

  // Walk only the triangles incident to this vertex, summing their
  // area-weighted normals. One thread, one output slot, no atomics.
  var n = vec3<f32>(0.0, 0.0, 0.0);
  for (var i = adjStart[v]; i < adjStart[v + 1u]; i = i + 1u) {
    n = n + faceNormal(adjTris[i]);
  }

  if (dot(n, n) > 0.0) { n = normalize(n); }
  normals[3u * v]      = n.x;
  normals[3u * v + 1u] = n.y;
  normals[3u * v + 2u] = n.z;
}
// #endregion gather
