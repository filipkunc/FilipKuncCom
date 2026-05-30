// Draws each vertex normal as a short line segment, with no geometry buffer of
// its own. A line-list draw of vertexCount * 2 vertices keys off the vertex
// index: it reads the same positions and normals buffers the mesh pipeline
// uses, deriving both endpoints procedurally.

struct Camera {
  mvp : mat4x4<f32>,
  model : mat4x4<f32>,
  lightDir : vec4<f32>,
  params : vec4<f32>, // x = normal-line length
};
@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<storage, read> positions : array<f32>;
@group(0) @binding(2) var<storage, read> normals : array<f32>;

// #region procedural-lines
@vertex
fn vs(@builtin(vertex_index) vi : u32) -> @builtin(position) vec4<f32> {
  let v = vi / 2u;            // two endpoints per vertex
  let tip = f32(vi & 1u);     // 0 = base point, 1 = tip along the normal
  let p = vec3<f32>(positions[3u * v], positions[3u * v + 1u], positions[3u * v + 2u]);
  let n = vec3<f32>(normals[3u * v], normals[3u * v + 1u], normals[3u * v + 2u]);
  let world = p + n * (tip * camera.params.x);
  return camera.mvp * vec4<f32>(world, 1.0);
}
// #endregion procedural-lines

@fragment
fn fs() -> @location(0) vec4<f32> {
  return vec4<f32>(0.95, 0.55, 0.25, 1.0);
}
