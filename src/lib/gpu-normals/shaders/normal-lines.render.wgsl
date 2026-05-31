// Draws each vertex normal as a short line segment, with no geometry buffer of
// its own. The shared positions and normals buffers (the same ones the mesh
// pipeline draws from) are bound as per-instance vertex attributes: one instance
// per mesh vertex, two vertices per instance for the segment's base and tip.
//
// Reading them as vertex attributes rather than as vertex-stage storage buffers
// is what lets this run in WebGPU compatibility mode, where the guaranteed
// number of storage buffers visible to the vertex stage is zero. That is the
// limit many mobile GPUs (Mali, for one) actually report, so the storage-in-the-
// vertex-stage version simply fails to create a pipeline there.

struct Camera {
  mvp : mat4x4<f32>,
  model : mat4x4<f32>,
  lightDir : vec4<f32>,
  params : vec4<f32>, // x = normal-line length
};
@group(0) @binding(0) var<uniform> camera : Camera;

// #region procedural-lines
@vertex
fn vs(
  @builtin(vertex_index) vi : u32,   // 0 = base point, 1 = tip along the normal
  @location(0) base : vec3<f32>,     // per-instance: this vertex's position
  @location(1) normal : vec3<f32>,   // per-instance: the normal at that vertex
) -> @builtin(position) vec4<f32> {
  let world = base + normal * (f32(vi) * camera.params.x);
  return camera.mvp * vec4<f32>(world, 1.0);
}
// #endregion procedural-lines

@fragment
fn fs() -> @location(0) vec4<f32> {
  return vec4<f32>(0.95, 0.55, 0.25, 1.0);
}
