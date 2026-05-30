// The same per-vertex gather, written once in Slang. slangc compiles it to PTX
// (for CUDA), SPIR-V (for Vulkan), and more from this single source. The
// benchmark compiles it to PTX and launches it through the CUDA driver API.

// #region slang-kernel
RWStructuredBuffer<float> positions;
RWStructuredBuffer<uint>  indices;
RWStructuredBuffer<uint>  adjStart;
RWStructuredBuffer<uint>  adjTris;
RWStructuredBuffer<float> normals;
uniform uint vertexCount;

float3 getPos(uint i) {
  return float3(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);
}

[shader("compute")]
[numthreads(64, 1, 1)]
void computeMain(uint3 tid : SV_DispatchThreadID) {
  uint v = tid.x;
  if (v >= vertexCount) return;

  float3 n = float3(0.0);
  for (uint i = adjStart[v]; i < adjStart[v + 1]; ++i) {
    uint t = adjTris[i];
    float3 a = getPos(indices[3 * t]);
    float3 b = getPos(indices[3 * t + 1]);
    float3 c = getPos(indices[3 * t + 2]);
    n += cross(b - a, c - a);
  }
  if (dot(n, n) > 0.0) n = normalize(n);
  normals[3 * v] = n.x;
  normals[3 * v + 1] = n.y;
  normals[3 * v + 2] = n.z;
}
// #endregion slang-kernel
