// The same per-vertex gather, in OpenCL C: the dialect MeshMaker's original
// playground used. run-opencl.c reads this file at runtime and builds it with
// clCreateProgramWithSource before launching it on the GPU.

// #region opencl-kernel
__kernel void vertexNormals(__global const float* pos, __global const uint* indices,
                            __global const uint* adjStart, __global const uint* adjTris,
                            __global float* normals, uint vertexCount) {
  uint v = get_global_id(0);
  if (v >= vertexCount) return;
  float3 n = (float3)(0.0f, 0.0f, 0.0f);
  for (uint i = adjStart[v]; i < adjStart[v + 1]; ++i) {
    uint t = adjTris[i];
    uint a = indices[3*t], b = indices[3*t+1], c = indices[3*t+2];
    float3 pa = (float3)(pos[3*a], pos[3*a+1], pos[3*a+2]);
    float3 pb = (float3)(pos[3*b], pos[3*b+1], pos[3*b+2]);
    float3 pc = (float3)(pos[3*c], pos[3*c+1], pos[3*c+2]);
    n += cross(pb - pa, pc - pa);
  }
  float len = length(n);
  if (len > 0.0f) n /= len;
  normals[3*v] = n.x; normals[3*v+1] = n.y; normals[3*v+2] = n.z;
}
// #endregion opencl-kernel
