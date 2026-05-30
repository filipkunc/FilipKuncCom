// Renders the cloth. Its two vertex buffers are the position and normal buffers
// the compute passes just wrote, read in place. Cloth is two-sided, so the
// fragment shader flips the normal for back faces and tints the two sides
// differently to read the folds.

struct Camera {
  mvp : mat4x4<f32>,
  model : mat4x4<f32>,
  lightDir : vec4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct VertexIn {
  @location(0) position : vec3<f32>, // the simulated position buffer
  @location(1) normal   : vec3<f32>, // the buffer the normals pass filled
};
struct VertexOut {
  @builtin(position) clip : vec4<f32>,
  @location(0) worldNormal : vec3<f32>,
};

@vertex
fn vs(in : VertexIn) -> VertexOut {
  var out : VertexOut;
  out.clip = camera.mvp * vec4<f32>(in.position, 1.0);
  out.worldNormal = (camera.model * vec4<f32>(in.normal, 0.0)).xyz;
  return out;
}

// #region cloth-shading
@fragment
fn fs(in : VertexOut, @builtin(front_facing) front : bool) -> @location(0) vec4<f32> {
  var N = normalize(in.worldNormal);
  if (!front) { N = -N; } // light the back face too
  let L = normalize(camera.lightDir.xyz);
  let diffuse = max(dot(N, L), 0.0);
  let ambient = 0.24;
  // Cool front, warm back, so a fold that turns the cloth over is obvious.
  let base = select(vec3<f32>(0.85, 0.42, 0.28), vec3<f32>(0.34, 0.52, 0.86), front);
  return vec4<f32>(base * (ambient + diffuse * 0.9), 1.0);
}
// #endregion cloth-shading
