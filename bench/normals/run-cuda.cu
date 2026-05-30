// CUDA runner: the per-vertex gather kernel, on the GPU, timed over the shared
// mesh. Prints a RESULT line the driver parses. Build + run is handled by
// scripts/bench-normals.mjs (nvcc -arch=native).
// Plain C-style host code (no libstdc++) so nvcc's host parser stays happy on
// very new toolchains.
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <cuda_runtime.h>

// #region cuda-kernel
__global__ void vertexNormals(const float* pos, const unsigned* indices,
                              const unsigned* adjStart, const unsigned* adjTris,
                              float* normals, unsigned vertexCount) {
  unsigned v = blockIdx.x * blockDim.x + threadIdx.x;
  if (v >= vertexCount) return;

  float nx = 0.f, ny = 0.f, nz = 0.f;
  for (unsigned i = adjStart[v]; i < adjStart[v + 1]; ++i) {
    unsigned t = adjTris[i];
    unsigned a = indices[3 * t], b = indices[3 * t + 1], c = indices[3 * t + 2];
    float e1x = pos[3*b] - pos[3*a], e1y = pos[3*b+1] - pos[3*a+1], e1z = pos[3*b+2] - pos[3*a+2];
    float e2x = pos[3*c] - pos[3*a], e2y = pos[3*c+1] - pos[3*a+1], e2z = pos[3*c+2] - pos[3*a+2];
    nx += e1y * e2z - e1z * e2y;
    ny += e1z * e2x - e1x * e2z;
    nz += e1x * e2y - e1y * e2x;
  }
  float len = sqrtf(nx*nx + ny*ny + nz*nz);
  if (len > 0.f) { nx /= len; ny /= len; nz /= len; }
  normals[3*v] = nx; normals[3*v+1] = ny; normals[3*v+2] = nz;
}
// #endregion cuda-kernel

static void* readArray(FILE* f, size_t n, size_t elem) {
  void* p = malloc(n * elem);
  if (!p || fread(p, elem, n, f) != n) { fprintf(stderr, "short read\n"); exit(1); }
  return p;
}

int main(int argc, char** argv) {
  const char* path = argc > 1 ? argv[1] : "mesh.bin";
  FILE* f = fopen(path, "rb");
  if (!f) { fprintf(stderr, "cannot open %s\n", path); return 1; }
  uint32_t V = 0, T = 0;
  if (fread(&V, 4, 1, f) != 1 || fread(&T, 4, 1, f) != 1) return 1;
  float* positions   = (float*)readArray(f, 3 * V, 4);
  uint32_t* indices  = (uint32_t*)readArray(f, 3 * T, 4);
  uint32_t* adjStart = (uint32_t*)readArray(f, V + 1, 4);
  uint32_t* adjTris  = (uint32_t*)readArray(f, 3 * T, 4);
  fclose(f);

  float *dPos, *dNorm; unsigned *dIdx, *dStart, *dTris;
  cudaMalloc(&dPos, 3*V*4); cudaMalloc(&dNorm, 3*V*4);
  cudaMalloc(&dIdx, 3*T*4); cudaMalloc(&dStart, (V+1)*4); cudaMalloc(&dTris, 3*T*4);
  cudaMemcpy(dPos, positions, 3*V*4, cudaMemcpyHostToDevice);
  cudaMemcpy(dIdx, indices, 3*T*4, cudaMemcpyHostToDevice);
  cudaMemcpy(dStart, adjStart, (V+1)*4, cudaMemcpyHostToDevice);
  cudaMemcpy(dTris, adjTris, 3*T*4, cudaMemcpyHostToDevice);

  int block = 128, grid = (V + block - 1) / block;
  cudaEvent_t a, b; cudaEventCreate(&a); cudaEventCreate(&b);
  // Warm up, then time the best of many launches.
  for (int i = 0; i < 5; i++) vertexNormals<<<grid, block>>>(dPos, dIdx, dStart, dTris, dNorm, V);
  cudaDeviceSynchronize();
  float best = 1e30f;
  for (int i = 0; i < 200; i++) {
    cudaEventRecord(a);
    vertexNormals<<<grid, block>>>(dPos, dIdx, dStart, dTris, dNorm, V);
    cudaEventRecord(b); cudaEventSynchronize(b);
    float ms = 0; cudaEventElapsedTime(&ms, a, b);
    if (ms < best) best = ms;
  }

  float* normals = (float*)malloc(3 * V * 4);
  cudaMemcpy(normals, dNorm, 3*V*4, cudaMemcpyDeviceToHost);
  double checksum = 0;
  for (uint32_t v = 0; v < V; v++) checksum += normals[3*v] + 2.0*normals[3*v+1] + 3.0*normals[3*v+2];

  cudaDeviceProp prop; cudaGetDeviceProperties(&prop, 0);
  printf("RESULT lang=cuda device=\"%s\" vertices=%u triangles=%u ms=%.3f checksum=%.4f\n",
         prop.name, V, T, best, checksum);
  return 0;
}
