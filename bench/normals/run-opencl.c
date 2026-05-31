// OpenCL runner: the dialect MeshMaker's original playground used. Same
// per-vertex gather, timed over the shared mesh. Build + run is handled by
// scripts/bench-normals.mjs.
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#define CL_TARGET_OPENCL_VERSION 120
#include <CL/cl.h>

static void* readArray(FILE* f, size_t n, size_t elem) {
  void* p = malloc(n * elem);
  if (!p || fread(p, elem, n, f) != n) { fprintf(stderr, "short read\n"); exit(1); }
  return p;
}

// Read the whole kernel source from disk. The kernel lives in run-opencl.cl so
// it reads as real OpenCL, not an escaped C string; we hand it to OpenCL with
// clCreateProgramWithSource at runtime.
static char* readFileText(const char* path) {
  FILE* f = fopen(path, "rb");
  if (!f) { fprintf(stderr, "cannot open %s\n", path); exit(1); }
  fseek(f, 0, SEEK_END); long n = ftell(f); fseek(f, 0, SEEK_SET);
  char* buf = malloc(n + 1);
  if (!buf || fread(buf, 1, n, f) != (size_t)n) { fprintf(stderr, "short read %s\n", path); exit(1); }
  buf[n] = '\0';
  fclose(f);
  return buf;
}

int main(int argc, char** argv) {
  const char* path = argc > 1 ? argv[1] : "mesh.bin";
  const char* kernelPath = argc > 2 ? argv[2] : "run-opencl.cl";
  FILE* f = fopen(path, "rb");
  if (!f) { fprintf(stderr, "cannot open %s\n", path); return 1; }
  uint32_t V = 0, T = 0;
  if (fread(&V, 4, 1, f) != 1 || fread(&T, 4, 1, f) != 1) return 1;
  float* positions   = readArray(f, 3 * V, 4);
  uint32_t* indices  = readArray(f, 3 * T, 4);
  uint32_t* adjStart = readArray(f, V + 1, 4);
  uint32_t* adjTris  = readArray(f, 3 * T, 4);
  fclose(f);

  cl_platform_id platform; clGetPlatformIDs(1, &platform, NULL);
  cl_device_id device; clGetDeviceIDs(platform, CL_DEVICE_TYPE_GPU, 1, &device, NULL);
  char name[256] = {0}; clGetDeviceInfo(device, CL_DEVICE_NAME, sizeof(name), name, NULL);
  cl_context ctx = clCreateContext(NULL, 1, &device, NULL, NULL, NULL);
  cl_command_queue q = clCreateCommandQueue(ctx, device, CL_QUEUE_PROFILING_ENABLE, NULL);

  char* kernelSource = readFileText(kernelPath);
  cl_program prog = clCreateProgramWithSource(ctx, 1, (const char**)&kernelSource, NULL, NULL);
  if (clBuildProgram(prog, 1, &device, "", NULL, NULL) != CL_SUCCESS) {
    char log[8192]; clGetProgramBuildInfo(prog, device, CL_PROGRAM_BUILD_LOG, sizeof(log), log, NULL);
    fprintf(stderr, "build failed:\n%s\n", log); return 1;
  }
  cl_kernel kern = clCreateKernel(prog, "vertexNormals", NULL);

  cl_mem dPos   = clCreateBuffer(ctx, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, 3*V*4, positions, NULL);
  cl_mem dIdx   = clCreateBuffer(ctx, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, 3*T*4, indices, NULL);
  cl_mem dStart = clCreateBuffer(ctx, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, (V+1)*4, adjStart, NULL);
  cl_mem dTris  = clCreateBuffer(ctx, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, 3*T*4, adjTris, NULL);
  cl_mem dNorm  = clCreateBuffer(ctx, CL_MEM_WRITE_ONLY, 3*V*4, NULL, NULL);
  clSetKernelArg(kern, 0, sizeof(cl_mem), &dPos);
  clSetKernelArg(kern, 1, sizeof(cl_mem), &dIdx);
  clSetKernelArg(kern, 2, sizeof(cl_mem), &dStart);
  clSetKernelArg(kern, 3, sizeof(cl_mem), &dTris);
  clSetKernelArg(kern, 4, sizeof(cl_mem), &dNorm);
  clSetKernelArg(kern, 5, sizeof(cl_uint), &V);

  size_t local = 128;
  size_t global = ((V + local - 1) / local) * local;
  double best = 1e30;
  for (int i = 0; i < 200; i++) {
    cl_event ev;
    clEnqueueNDRangeKernel(q, kern, 1, NULL, &global, &local, 0, NULL, &ev);
    clFinish(q);
    cl_ulong t0, t1;
    clGetEventProfilingInfo(ev, CL_PROFILING_COMMAND_START, sizeof(t0), &t0, NULL);
    clGetEventProfilingInfo(ev, CL_PROFILING_COMMAND_END, sizeof(t1), &t1, NULL);
    double ms = (double)(t1 - t0) / 1e6;
    if (i >= 5 && ms < best) best = ms; // skip warm-up
    clReleaseEvent(ev);
  }

  float* normals = malloc(3 * V * 4);
  clEnqueueReadBuffer(q, dNorm, CL_TRUE, 0, 3*V*4, normals, 0, NULL, NULL);
  double checksum = 0;
  for (uint32_t v = 0; v < V; v++) checksum += normals[3*v] + 2.0*normals[3*v+1] + 3.0*normals[3*v+2];

  printf("RESULT lang=opencl device=\"%s\" vertices=%u triangles=%u ms=%.3f checksum=%.4f\n",
         name, V, T, best, checksum);
  return 0;
}
