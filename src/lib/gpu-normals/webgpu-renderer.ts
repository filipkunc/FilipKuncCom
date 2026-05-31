// The browser-only WebGPU orchestrator. Imported with dynamic import() from the
// island so nothing here runs on the server. It owns the device, the buffers,
// the compute pipeline that fills the normals buffer, and the two render
// pipelines that read it. The normals buffer is created once and shared: the
// compute pass writes it, the render passes read it as a vertex buffer, and it
// is never copied to the CPU during normal drawing.

import meshComputeSrc from './shaders/normals.compute.wgsl?raw';
import meshRenderSrc from './shaders/mesh.render.wgsl?raw';
import normalLinesSrc from './shaders/normal-lines.render.wgsl?raw';
import { makeMesh, buildAdjacency, type Mesh, type Adjacency, type MeshName } from './mesh';
import { computeVertexNormals } from './cpu-normals';

export class WebGPUUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebGPUUnavailableError';
  }
}

// Acquire a WebGPU adapter, preferring the full "core" profile but falling back
// to compatibility mode. Some mobile GPUs (the Mali in a Samsung A54, for one)
// expose WebGPU only through the compatibility subset, so requestAdapter() with
// no options returns null on them unless the user flips the chrome://flags
// unsafe-webgpu override. Both labs here stay inside the compat subset, so the
// fallback draws the same scene. Asking for "compatibility" on a desktop core
// device still returns an adapter, so this is safe everywhere.
export async function requestCompatAwareAdapter(): Promise<GPUAdapter | null> {
  const core = await navigator.gpu.requestAdapter();
  if (core) return core;
  return navigator.gpu.requestAdapter({ featureLevel: 'compatibility' });
}

export type ComputeMode = 'gpu' | 'cpu';

export interface CreateOptions {
  mesh: MeshName;
  mode: ComputeMode;
  showNormals: boolean;
  autoRotate: boolean;
  subdivisions?: number;
  onDeviceLost?: (reason: string) => void;
}

export interface ReadbackResult {
  bytes: number;
  ms: number;
  maxDelta: number;
  vertexCount: number;
}

export interface RendererHandle {
  setMesh(name: MeshName, subdivisions?: number): void;
  setComputeMode(mode: ComputeMode): void;
  setShowNormals(show: boolean): void;
  setAutoRotate(on: boolean): void;
  measureReadback(): Promise<ReadbackResult>;
  vertexCount(): number;
  triangleCount(): number;
  // Testing hooks. renderToPixels draws one frame into an offscreen texture and
  // reads it back, so a test can confirm the mesh actually rasterizes without
  // depending on canvas presentation (which a software adapter cannot do).
  renderToPixels(size?: number): Promise<{ opaque: number; total: number }>;
  adapterInfo(): { architecture: string };
  destroy(): void;
}

const NORMAL_LINE_LENGTH = 0.18;
const CAMERA_FLOATS = 40; // mat4 mvp + mat4 model + vec4 light + vec4 params

export async function create(canvas: HTMLCanvasElement, opts: CreateOptions): Promise<RendererHandle> {
  if (!navigator.gpu) {
    throw new WebGPUUnavailableError('navigator.gpu is not available in this browser');
  }
  const adapter = await requestCompatAwareAdapter();
  if (!adapter) {
    throw new WebGPUUnavailableError('no WebGPU adapter (the GPU may be blocked or unsupported)');
  }
  const device = await adapter.requestDevice();
  const adapterArchitecture = adapter.info?.architecture ?? '';
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new WebGPUUnavailableError('could not get a webgpu canvas context');
  }
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'premultiplied' });

  device.lost.then((info) => {
    if (!destroyed) opts.onDeviceLost?.(info.message || info.reason);
  });
  // Surface anything WebGPU would otherwise only whisper to the console. A
  // reserved-word in WGSL or a bad binding used to fail silently and just blank
  // the frame; now it lands somewhere a human (or a test) will see it.
  device.onuncapturederror = (event) => {
    // eslint-disable-next-line no-console
    console.error('[normals-lab] uncaptured WebGPU error:', event.error.message);
  };

  // Compile a WGSL module and refuse to continue if it has errors, instead of
  // letting an invalid module poison every command buffer that uses it.
  async function compile(label: string, code: string): Promise<GPUShaderModule> {
    const module = device.createShaderModule({ label, code });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      const detail = errors.map((m) => `${label}:${m.lineNum}:${m.linePos} ${m.message}`).join('\n');
      throw new Error(`WGSL compile error\n${detail}`);
    }
    return module;
  }

  // --- pipelines -----------------------------------------------------------
  const computeModule = await compile('normals.compute', meshComputeSrc);
  const computePipeline = await device.createComputePipelineAsync({
    layout: 'auto',
    compute: { module: computeModule, entryPoint: 'main' },
  });

  const posLayout: GPUVertexBufferLayout = {
    arrayStride: 12,
    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
  };
  const normLayout: GPUVertexBufferLayout = {
    arrayStride: 12,
    attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
  };
  const depthFormat: GPUTextureFormat = 'depth24plus';

  const meshModule = await compile('mesh.render', meshRenderSrc);
  const meshPipeline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: { module: meshModule, entryPoint: 'vs', buffers: [posLayout, normLayout] },
    fragment: { module: meshModule, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: depthFormat, depthWriteEnabled: true, depthCompare: 'less' },
  });

  const linesModule = await compile('normal-lines.render', normalLinesSrc);
  // The positions and normals buffers feed the line pipeline as per-instance
  // attributes (one instance per vertex), not as vertex-stage storage buffers,
  // so this works in compatibility mode where vertex-stage storage is forbidden.
  const lineInstanceLayout = (shaderLocation: number): GPUVertexBufferLayout => ({
    arrayStride: 12,
    stepMode: 'instance',
    attributes: [{ shaderLocation, offset: 0, format: 'float32x3' }],
  });
  const linesPipeline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
      module: linesModule,
      entryPoint: 'vs',
      buffers: [lineInstanceLayout(0), lineInstanceLayout(1)],
    },
    fragment: { module: linesModule, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'line-list' },
    depthStencil: { format: depthFormat, depthWriteEnabled: true, depthCompare: 'less' },
  });

  // --- shared resources ----------------------------------------------------
  const cameraBuffer = device.createBuffer({
    size: CAMERA_FLOATS * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const cameraData = new Float32Array(CAMERA_FLOATS);
  const meshBindGroup = device.createBindGroup({
    layout: meshPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: cameraBuffer } }],
  });
  // The line pipeline now reads positions/normals as vertex buffers, so its only
  // bind-group resource is the shared camera uniform, which never changes per
  // mesh. Build it once rather than rebuilding it on every mesh load.
  const linesBindGroup = device.createBindGroup({
    layout: linesPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: cameraBuffer } }],
  });

  // --- per-mesh state ------------------------------------------------------
  let mesh: Mesh;
  let adjacency: Adjacency;
  let positionsBuffer: GPUBuffer;
  let indicesBuffer: GPUBuffer;
  let normalsBuffer: GPUBuffer;
  let adjStartBuffer: GPUBuffer;
  let adjTrisBuffer: GPUBuffer;
  let metaBuffer: GPUBuffer;
  let computeBindGroup: GPUBindGroup;
  let indexCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;

  let mode: ComputeMode = opts.mode;
  let showNormals = opts.showNormals;
  let autoRotate = opts.autoRotate;
  let angle = 0.6;
  let depthTexture: GPUTexture | null = null;
  let destroyed = false;

  function disposeMeshBuffers() {
    positionsBuffer?.destroy();
    indicesBuffer?.destroy();
    normalsBuffer?.destroy();
    adjStartBuffer?.destroy();
    adjTrisBuffer?.destroy();
    metaBuffer?.destroy();
  }

  function loadMesh(name: MeshName, subdivisions?: number) {
    disposeMeshBuffers();
    mesh = makeMesh(name, subdivisions ?? opts.subdivisions ?? 3);
    adjacency = buildAdjacency(mesh);
    vertexCount = mesh.positions.length / 3;
    triangleCount = mesh.indices.length / 3;
    indexCount = mesh.indices.length;

    positionsBuffer = device.createBuffer({
      size: mesh.positions.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(positionsBuffer, 0, mesh.positions);

    indicesBuffer = device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indicesBuffer, 0, mesh.indices);

    // The star of the show: storage (compute writes it), vertex (render reads
    // it), copy-src (the bandwidth demo reads it back).
    normalsBuffer = device.createBuffer({
      size: mesh.positions.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.VERTEX |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST,
    });

    adjStartBuffer = device.createBuffer({
      size: adjacency.adjStart.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(adjStartBuffer, 0, adjacency.adjStart);

    adjTrisBuffer = device.createBuffer({
      size: adjacency.adjTris.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(adjTrisBuffer, 0, adjacency.adjTris);

    metaBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(metaBuffer, 0, new Uint32Array([vertexCount, triangleCount, 0, 0]));

    computeBindGroup = device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: positionsBuffer } },
        { binding: 1, resource: { buffer: indicesBuffer } },
        { binding: 2, resource: { buffer: adjStartBuffer } },
        { binding: 3, resource: { buffer: adjTrisBuffer } },
        { binding: 4, resource: { buffer: normalsBuffer } },
        { binding: 5, resource: { buffer: metaBuffer } },
      ],
    });

    // Fill the normals buffer immediately so the very first frame is correct,
    // regardless of which producer is active.
    fillNormals();
  }

  function encodeCompute(encoder: GPUCommandEncoder) {
    const pass = encoder.beginComputePass();
    pass.setPipeline(computePipeline);
    pass.setBindGroup(0, computeBindGroup);
    pass.dispatchWorkgroups(Math.ceil(vertexCount / 64));
    pass.end();
  }

  // Make the normals buffer current for the active producer. The GPU path
  // dispatches the compute shader; the CPU path runs the reference function and
  // uploads the result into the same buffer.
  function fillNormals() {
    if (mode === 'gpu') {
      const encoder = device.createCommandEncoder();
      encodeCompute(encoder);
      device.queue.submit([encoder.finish()]);
    } else {
      const cpu = computeVertexNormals(mesh.positions, mesh.indices);
      device.queue.writeBuffer(normalsBuffer, 0, cpu);
    }
  }

  function ensureDepth(width: number, height: number) {
    if (depthTexture && depthTexture.width === width && depthTexture.height === height) return;
    depthTexture?.destroy();
    depthTexture = device.createTexture({
      size: { width, height },
      format: depthFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  function updateCamera(width: number, height: number) {
    const aspect = width / Math.max(height, 1);
    const model = mul(rotationX(0.35), rotationY(angle));
    const view = translation(0, 0, -3.2);
    const proj = perspective(Math.PI / 4, aspect, 0.1, 100);
    const mvp = mul(proj, mul(view, model));

    cameraData.set(mvp, 0);
    cameraData.set(model, 16);
    const l = normalize3(0.4, 0.8, 0.6);
    cameraData.set([l[0], l[1], l[2], 0], 32);
    cameraData.set([NORMAL_LINE_LENGTH, 0, 0, 0], 36);
    device.queue.writeBuffer(cameraBuffer, 0, cameraData);
  }

  let raf = 0;
  let lastTime = 0;
  function frame(now: number) {
    if (destroyed) return;
    const dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;
    if (autoRotate) angle += dt * 0.5;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ensureDepth(width, height);
    updateCamera(width, height);

    const encoder = device.createCommandEncoder();
    encodeScene(encoder, context!.getCurrentTexture().createView(), depthTexture!.createView());
    device.queue.submit([encoder.finish()]);
    raf = requestAnimationFrame(frame);
  }

  // Encode one frame into the given color/depth views. In GPU mode the compute
  // pipeline refills the normals buffer first, then the render pipeline reads it
  // straight away, with no CPU in the loop. Shared by the live canvas and the
  // offscreen render used for testing.
  function encodeScene(encoder: GPUCommandEncoder, colorView: GPUTextureView, depthView: GPUTextureView) {
    if (mode === 'gpu') encodeCompute(encoder);

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        { view: colorView, clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: 'clear', storeOp: 'store' },
      ],
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    pass.setPipeline(meshPipeline);
    pass.setBindGroup(0, meshBindGroup);
    pass.setVertexBuffer(0, positionsBuffer);
    pass.setVertexBuffer(1, normalsBuffer);
    pass.setIndexBuffer(indicesBuffer, 'uint32');
    pass.drawIndexed(indexCount);

    if (showNormals) {
      pass.setPipeline(linesPipeline);
      pass.setBindGroup(0, linesBindGroup);
      pass.setVertexBuffer(0, positionsBuffer);
      pass.setVertexBuffer(1, normalsBuffer);
      // 2 vertices (base, tip) per instance, one instance per mesh vertex.
      pass.draw(2, vertexCount);
    }

    pass.end();
  }

  loadMesh(opts.mesh, opts.subdivisions);
  raf = requestAnimationFrame(frame);

  return {
    setMesh(name, subdivisions) {
      loadMesh(name, subdivisions);
    },
    setComputeMode(next) {
      mode = next;
      fillNormals();
    },
    setShowNormals(show) {
      showNormals = show;
    },
    setAutoRotate(on) {
      autoRotate = on;
    },
    vertexCount: () => vertexCount,
    triangleCount: () => triangleCount,
    async measureReadback(): Promise<ReadbackResult> {
      const size = normalsBuffer.size;
      const readBuffer = device.createBuffer({
        size,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      const encoder = device.createCommandEncoder();
      if (mode === 'gpu') encodeCompute(encoder); // make sure the data is fresh
      encoder.copyBufferToBuffer(normalsBuffer, 0, readBuffer, 0, size);
      const t0 = performance.now();
      device.queue.submit([encoder.finish()]);
      await readBuffer.mapAsync(GPUMapMode.READ);
      const ms = performance.now() - t0;
      const gpuNormals = new Float32Array(readBuffer.getMappedRange().slice(0));
      readBuffer.unmap();
      readBuffer.destroy();

      // Cross-check against the CPU reference: the two should agree to float32.
      const cpu = computeVertexNormals(mesh.positions, mesh.indices);
      let maxDelta = 0;
      for (let i = 0; i < cpu.length; i++) {
        maxDelta = Math.max(maxDelta, Math.abs(cpu[i] - gpuNormals[i]));
      }
      return { bytes: size, ms, maxDelta, vertexCount };
    },
    adapterInfo: () => ({ architecture: adapterArchitecture }),
    async renderToPixels(size = 64): Promise<{ opaque: number; total: number }> {
      // Square, 64px so the row stride (64 * 4 = 256) already meets the 256-byte
      // copyTextureToBuffer alignment with no padding math.
      const color = device.createTexture({
        size: { width: size, height: size },
        format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
      const depth = device.createTexture({
        size: { width: size, height: size },
        format: depthFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      const bytesPerRow = size * 4;
      const readBuffer = device.createBuffer({
        size: bytesPerRow * size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      updateCamera(size, size);
      const encoder = device.createCommandEncoder();
      encodeScene(encoder, color.createView(), depth.createView());
      encoder.copyTextureToBuffer(
        { texture: color },
        { buffer: readBuffer, bytesPerRow },
        { width: size, height: size },
      );
      device.queue.submit([encoder.finish()]);
      await readBuffer.mapAsync(GPUMapMode.READ);
      const pixels = new Uint8Array(readBuffer.getMappedRange().slice(0));
      readBuffer.unmap();
      readBuffer.destroy();
      color.destroy();
      depth.destroy();

      let opaque = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 16) opaque++;
      return { opaque, total: size * size };
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      disposeMeshBuffers();
      cameraBuffer.destroy();
      depthTexture?.destroy();
      try {
        context?.unconfigure();
      } catch {
        /* context may already be gone */
      }
      device.destroy();
    },
  };
}

// --- minimal column-major mat4 helpers (no dependency) ---------------------

type Mat4 = Float32Array;

function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function rotationY(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m = new Float32Array(16);
  m[0] = c; m[2] = -s; m[5] = 1; m[8] = s; m[10] = c; m[15] = 1;
  return m;
}

function rotationX(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m = new Float32Array(16);
  m[0] = 1; m[5] = c; m[6] = s; m[9] = -s; m[10] = c; m[15] = 1;
  return m;
}

function translation(x: number, y: number, z: number): Mat4 {
  const m = new Float32Array(16);
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
  m[12] = x; m[13] = y; m[14] = z;
  return m;
}

// Perspective mapping z into [0, 1], the WebGPU clip-space convention.
function perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = far * nf;
  m[11] = -1;
  m[14] = far * near * nf;
  return m;
}

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}
