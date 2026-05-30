// The whole cloth lives on the GPU. Three kinds of compute pass run every
// frame over the same buffers:
//   integrate - Verlet step: gravity + wind move each free particle
//   solve     - distance constraints pull neighbours back to rest length
//   normals   - the area-weighted gather (the same one the post teaches),
//               recomputed from the freshly deformed positions
// Positions never leave the GPU in GPU mode: the render pipeline reads the
// position and normal buffers in place.

struct Sim {
  cols : u32,
  rows : u32,
  vertexCount : u32,
  pinStride : u32,     // pin every Nth particle along the top edge
  gravity : vec4<f32>, // xyz force, w dt
  wind : vec4<f32>,    // xyz direction*strength, w time
  rest : vec4<f32>,    // x restX, y restY, z stiffness, w damping
  sphere : vec4<f32>,  // xyz centre, w radius (0 disables)
};

// #region cloth-bindings
@group(0) @binding(0) var<storage, read_write> pos      : array<f32>;
@group(0) @binding(1) var<storage, read_write> prevPos  : array<f32>;
@group(0) @binding(2) var<storage, read_write> normals  : array<f32>;
@group(0) @binding(3) var<storage, read>       indices  : array<u32>;
@group(0) @binding(4) var<storage, read>       adjStart : array<u32>;
@group(0) @binding(5) var<storage, read>       adjTris  : array<u32>;
@group(0) @binding(6) var<uniform>             sim      : Sim;
@group(0) @binding(7) var<storage, read>       lra      : array<f32>; // 4 per vertex: pin xyz, max distance
// #endregion cloth-bindings

// Which constraint family and parity this solve pass handles. Specialized into
// eight pipelines so no two constraints in one pass ever touch the same
// particle, which is what makes the parallel solve race-free without atomics.
override AXIS  : u32 = 0u;
override COLOR : u32 = 0u;

fn getPos(i : u32) -> vec3<f32> {
  return vec3<f32>(pos[3u * i], pos[3u * i + 1u], pos[3u * i + 2u]);
}
fn setPos(i : u32, p : vec3<f32>) {
  pos[3u * i] = p.x; pos[3u * i + 1u] = p.y; pos[3u * i + 2u] = p.z;
}
fn pinned(i : u32) -> bool {
  // Pin only a few points along the top edge. The cloth sags between them into
  // folds, like a curtain on rings, instead of hanging as one taut sheet.
  let r = i / sim.cols;
  let c = i % sim.cols;
  if (r != 0u) { return false; }
  return (c % sim.pinStride == 0u) || (c == sim.cols - 1u);
}

// #region cloth-integrate
@compute @workgroup_size(64)
fn integrate(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= sim.vertexCount) { return; }
  if (pinned(i)) { return; }

  let p = getPos(i);
  let prev = vec3<f32>(prevPos[3u * i], prevPos[3u * i + 1u], prevPos[3u * i + 2u]);
  let dt = sim.gravity.w;

  // Gentle out-of-plane gust that varies across the sheet, so a firmly hanging
  // cloth ripples into travelling curtain folds instead of staying flat. Kept
  // positive and weaker than gravity, so the cloth billows but never blows away.
  let t = sim.wind.w;
  let gust = 0.5 + 0.5 * sin(p.x * 6.0 + t * 2.0) * cos(p.y * 2.0 + t * 0.7);
  let accel = sim.gravity.xyz + sim.wind.xyz * gust;

  // Verlet integration: velocity is implied by (p - prev).
  var next = p + (p - prev) * sim.rest.w + accel * dt * dt;

  // Push out of the interactive sphere.
  if (sim.sphere.w > 0.0) {
    let d = next - sim.sphere.xyz;
    let dist = length(d);
    if (dist < sim.sphere.w) {
      next = sim.sphere.xyz + d / max(dist, 1e-5) * sim.sphere.w;
    }
  }

  prevPos[3u * i] = p.x; prevPos[3u * i + 1u] = p.y; prevPos[3u * i + 2u] = p.z;
  setPos(i, next);
}
// #endregion cloth-integrate

fn solvePair(a : u32, b : u32, rest : f32) {
  let pa = getPos(a);
  let pb = getPos(b);
  let delta = pb - pa;
  let dist = length(delta);
  if (dist < 1e-6) { return; }

  let correction = delta * ((dist - rest) / dist) * 0.5 * sim.rest.z;
  let pa_pinned = pinned(a);
  let pb_pinned = pinned(b);
  if (pa_pinned && pb_pinned) { return; }
  if (pa_pinned) { setPos(b, pb - correction * 2.0); return; }
  if (pb_pinned) { setPos(a, pa + correction * 2.0); return; }
  setPos(a, pa + correction);
  setPos(b, pb - correction);
}

// #region cloth-solve
@compute @workgroup_size(64)
fn solve(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= sim.vertexCount) { return; }
  let c = i % sim.cols;
  let r = i / sim.cols;
  let diag = sqrt(sim.rest.x * sim.rest.x + sim.rest.y * sim.rest.y);

  if (AXIS == 0u) {                      // structural, horizontal
    if (c % 2u == COLOR && c + 1u < sim.cols) { solvePair(i, i + 1u, sim.rest.x); }
  } else if (AXIS == 1u) {               // structural, vertical
    if (r % 2u == COLOR && r + 1u < sim.rows) { solvePair(i, i + sim.cols, sim.rest.y); }
  } else if (AXIS == 2u) {               // shear, down-right diagonal
    if (r % 2u == COLOR && c + 1u < sim.cols && r + 1u < sim.rows) {
      solvePair(i, i + sim.cols + 1u, diag);
    }
  } else {                               // shear, down-left diagonal
    if (r % 2u == COLOR && c > 0u && r + 1u < sim.rows) {
      solvePair(i, i + sim.cols - 1u, diag);
    }
  }
}
// #endregion cloth-solve

// #region cloth-lra
// Long-range attachment: cap each particle's distance to its nearest pin. The
// pin position is fixed, so this needs no propagation and holds the whole sheet
// up in a single pass, which is what keeps the drape the same at every
// resolution instead of letting a high-res sheet sag away.
@compute @workgroup_size(64)
fn applyLRA(@builtin(global_invocation_id) gid : vec3<u32>) {
  let v = gid.x;
  if (v >= sim.vertexCount || pinned(v)) { return; }
  let pinPos = vec3<f32>(lra[4u * v], lra[4u * v + 1u], lra[4u * v + 2u]);
  let maxDist = lra[4u * v + 3u];
  let p = getPos(v);
  let d = p - pinPos;
  let len = length(d);
  if (len > maxDist) { setPos(v, pinPos + d / len * maxDist); }
}
// #endregion cloth-lra

fn faceNormal(t : u32) -> vec3<f32> {
  let a = getPos(indices[3u * t]);
  let b = getPos(indices[3u * t + 1u]);
  let c = getPos(indices[3u * t + 2u]);
  return cross(b - a, c - a);
}

// #region cloth-normals
@compute @workgroup_size(64)
fn computeNormals(@builtin(global_invocation_id) gid : vec3<u32>) {
  let v = gid.x;
  if (v >= sim.vertexCount) { return; }

  var n = vec3<f32>(0.0, 0.0, 0.0);
  for (var i = adjStart[v]; i < adjStart[v + 1u]; i = i + 1u) {
    n = n + faceNormal(adjTris[i]);
  }
  if (dot(n, n) > 0.0) { n = normalize(n); }
  normals[3u * v] = n.x;
  normals[3u * v + 1u] = n.y;
  normals[3u * v + 2u] = n.z;
}
// #endregion cloth-normals
