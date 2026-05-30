// Shaded-mesh render pipeline. Its second vertex buffer is the very same
// normals buffer the compute pass wrote, bound straight as a vertex attribute.
// No readback, no copy: the graphics pipeline reads what the compute pipeline
// produced, in place on the GPU.

struct Camera {
  mvp : mat4x4<f32>,
  model : mat4x4<f32>,
  lightDir : vec4<f32>,
  params : vec4<f32>, // x = normal-line length (unused here)
};
@group(0) @binding(0) var<uniform> camera : Camera;

// #region vertex-in
struct VertexIn {
  @location(0) position : vec3<f32>, // from the positions buffer
  @location(1) normal   : vec3<f32>, // from the buffer the compute pass filled
};
struct VertexOut {
  @builtin(position) clip : vec4<f32>,
  @location(0) worldNormal : vec3<f32>,
};

@vertex
fn vs(in : VertexIn) -> VertexOut {
  var out : VertexOut;
  out.clip = camera.mvp * vec4<f32>(in.position, 1.0);
  // The mesh only rotates, so the model matrix rotates the normal too.
  out.worldNormal = (camera.model * vec4<f32>(in.normal, 0.0)).xyz;
  return out;
}
// #endregion vertex-in

// #region shading
@fragment
fn fs(in : VertexOut) -> @location(0) vec4<f32> {
  let N = normalize(in.worldNormal);
  let L = normalize(camera.lightDir.xyz);
  let diffuse = max(dot(N, L), 0.0);
  let ambient = 0.2;
  // A faint rim term so the silhouette reads on dark and light backgrounds.
  let rim = pow(1.0 - max(dot(N, vec3<f32>(0.0, 0.0, 1.0)), 0.0), 3.0) * 0.3;
  let base = vec3<f32>(0.45, 0.55, 0.78);
  let color = base * (ambient + diffuse * 0.85) + vec3<f32>(rim);
  return vec4<f32>(color, 1.0);
}
// #endregion shading
