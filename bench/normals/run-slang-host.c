// Host for the Slang kernel. slangc compiles run-slang.slang to PTX; this loads
// that PTX through the CUDA driver API and launches it on the GPU. Slang passes
// shader parameters through a constant-memory block (SLANG_globalParams) rather
// than kernel arguments, so the host fills that block with device pointers at
// the offsets the generated PTX reads (decoded once from the PTX):
//   +0 positions  +16 indices  +32 adjStart  +48 adjTris  +64 normals  +80 vertexCount
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <cuda.h>

#define CHECK(x) do { CUresult r = (x); if (r != CUDA_SUCCESS) { const char* s; cuGetErrorString(r, &s); fprintf(stderr, "%s failed: %s\n", #x, s); return 1; } } while (0)

static void* readArray(FILE* f, size_t n, size_t elem) {
  void* p = malloc(n * elem);
  if (!p || fread(p, elem, n, f) != n) { fprintf(stderr, "short read\n"); exit(1); }
  return p;
}

int main(int argc, char** argv) {
  const char* mesh = argc > 1 ? argv[1] : "mesh.bin";
  const char* ptx = argc > 2 ? argv[2] : "run-slang.ptx";

  FILE* f = fopen(mesh, "rb");
  if (!f) { fprintf(stderr, "cannot open %s\n", mesh); return 1; }
  uint32_t V = 0, T = 0;
  if (fread(&V, 4, 1, f) != 1 || fread(&T, 4, 1, f) != 1) return 1;
  float* positions   = readArray(f, 3 * V, 4);
  uint32_t* indices  = readArray(f, 3 * T, 4);
  uint32_t* adjStart = readArray(f, V + 1, 4);
  uint32_t* adjTris  = readArray(f, 3 * T, 4);
  fclose(f);

  CHECK(cuInit(0));
  CUdevice dev; CHECK(cuDeviceGet(&dev, 0));
  char name[256]; CHECK(cuDeviceGetName(name, sizeof(name), dev));
  CUcontext ctx; CHECK(cuCtxCreate(&ctx, NULL, 0, dev)); // CUDA 13 _v4 signature

  CUdeviceptr dPos, dIdx, dStart, dTris, dNorm;
  CHECK(cuMemAlloc(&dPos, 3ull*V*4)); CHECK(cuMemAlloc(&dIdx, 3ull*T*4));
  CHECK(cuMemAlloc(&dStart, (V+1ull)*4)); CHECK(cuMemAlloc(&dTris, 3ull*T*4));
  CHECK(cuMemAlloc(&dNorm, 3ull*V*4));
  CHECK(cuMemcpyHtoD(dPos, positions, 3ull*V*4));
  CHECK(cuMemcpyHtoD(dIdx, indices, 3ull*T*4));
  CHECK(cuMemcpyHtoD(dStart, adjStart, (V+1ull)*4));
  CHECK(cuMemcpyHtoD(dTris, adjTris, 3ull*T*4));

  CUmodule mod; CHECK(cuModuleLoad(&mod, ptx));
  CUfunction fn; CHECK(cuModuleGetFunction(&fn, mod, "computeMain"));
  CUdeviceptr dParams; size_t paramSize;
  CHECK(cuModuleGetGlobal(&dParams, &paramSize, mod, "SLANG_globalParams"));

  unsigned char params[128];
  memset(params, 0, sizeof(params));
  memcpy(params + 0,  &dPos,  8);
  memcpy(params + 16, &dIdx,  8);
  memcpy(params + 32, &dStart, 8);
  memcpy(params + 48, &dTris, 8);
  memcpy(params + 64, &dNorm, 8);
  memcpy(params + 80, &V, 4);
  CHECK(cuMemcpyHtoD(dParams, params, paramSize));

  unsigned grid = (V + 63) / 64;
  CUevent a, b; cuEventCreate(&a, 0); cuEventCreate(&b, 0);
  for (int i = 0; i < 5; i++) cuLaunchKernel(fn, grid, 1, 1, 64, 1, 1, 0, 0, NULL, NULL);
  CHECK(cuCtxSynchronize());
  float best = 1e30f;
  for (int i = 0; i < 200; i++) {
    cuEventRecord(a, 0);
    CHECK(cuLaunchKernel(fn, grid, 1, 1, 64, 1, 1, 0, 0, NULL, NULL));
    cuEventRecord(b, 0); cuEventSynchronize(b);
    float ms = 0; cuEventElapsedTime(&ms, a, b);
    if (ms < best) best = ms;
  }

  float* normals = malloc(3ull * V * 4);
  CHECK(cuMemcpyDtoH(normals, dNorm, 3ull*V*4));
  double checksum = 0;
  for (uint32_t v = 0; v < V; v++) checksum += normals[3*v] + 2.0*normals[3*v+1] + 3.0*normals[3*v+2];

  printf("RESULT lang=slang device=\"%s\" vertices=%u triangles=%u ms=%.3f checksum=%.4f\n",
         name, V, T, best, checksum);
  return 0;
}
