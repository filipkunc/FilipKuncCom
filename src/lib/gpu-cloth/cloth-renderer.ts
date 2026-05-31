// Browser-only WebGPU orchestrator for the cloth demo. Dynamically imported by
// the island so nothing here touches navigator.gpu on the server.
//
// Every frame: a Verlet integrate pass, several colored constraint-solve passes,
// then the normals gather. In GPU mode the normals are computed on the GPU and
// the buffer is handed straight to the renderer. In CPU mode the positions are
// read back, normals are computed in JavaScript, and uploaded again, which is
// the slow, bandwidth-heavy path the post contrasts against.

import { WebGPUUnavailableError, requestCompatAwareAdapter } from '../gpu-normals/webgpu-renderer';
import { computeVertexNormals } from '../gpu-normals/cpu-normals';
import { makeClothGrid, GRID_STEPS, type ClothGrid } from './grid';

import clothComputeSrc from './shaders/cloth.compute.wgsl?raw';
import clothRenderSrc from './shaders/cloth.render.wgsl?raw';

export type NormalsMode = 'gpu' | 'cpu';

export interface ClothCreateOptions {
  gridStep: number; // index into GRID_STEPS
  normalsMode: NormalsMode;
  wind: boolean;
  onDeviceLost?: (reason: string) => void;
}

export interface ClothStats {
  fps: number;
  triangles: number;
  vertices: number;
  mode: NormalsMode;
  api: string; // which GPU API the demo runs on (WGSL via WebGPU)
  cpuNormalsMs: number; // last CPU normals time (CPU mode only)
  gpuNormalsMs: number; // last GPU normals-pass time, 0 if unavailable (GPU mode only)
  readbackBytes: number; // bytes pulled back per frame (CPU mode only)
}

export interface ClothHandle {
  setGrid(step: number): void;
  setNormalsMode(mode: NormalsMode): void;
  setWind(on: boolean): void;
  setPaused(on: boolean): void;
  setPointer(ndcX: number, ndcY: number, active: boolean): void;
  stats(): ClothStats;
  // Testing hook: advance the sim, read normals back, compare to the CPU
  // reference on the same deformed positions. Max delta should be ~0.
  verifyNormals(): Promise<{ maxDelta: number; vertices: number; movedFromRest: number }>;
  // Testing hook: render one frame to an offscreen texture and count opaque
  // pixels, so a test can catch a blank render without canvas presentation.
  renderToPixels(size?: number): Promise<{ opaque: number; total: number }>;
  adapterInfo(): { architecture: string };
  destroy(): void;
}

// Firm per-pass constraint stiffness. Kept high so tension actually reaches the
// pins and holds the cloth up, rather than letting it sag away under gravity.
const STIFFNESS = 0.85;
const DT = 1 / 60;
const CAMERA_FLOATS = 36; // mat4 mvp + mat4 model + vec4 light

// Eight specialized solve passes: 4 constraint families x 2 parities. No two
// constraints in one pass share a particle, so the parallel solve never races.
const SOLVE_VARIANTS = [
  { AXIS: 0, COLOR: 0 }, { AXIS: 0, COLOR: 1 },
  { AXIS: 1, COLOR: 0 }, { AXIS: 1, COLOR: 1 },
  { AXIS: 2, COLOR: 0 }, { AXIS: 2, COLOR: 1 },
  { AXIS: 3, COLOR: 0 }, { AXIS: 3, COLOR: 1 },
];

export async function create(canvas: HTMLCanvasElement, opts: ClothCreateOptions): Promise<ClothHandle> {
  if (!navigator.gpu) throw new WebGPUUnavailableError('navigator.gpu is not available');
  const adapter = await requestCompatAwareAdapter();
  if (!adapter) throw new WebGPUUnavailableError('no WebGPU adapter');
  // timestamp-query lets us time the normals pass on the GPU itself. Not every
  // adapter exposes it (notably the SwiftShader fallback), so it is optional.
  const canTimestamp = adapter.features.has('timestamp-query');
  const device = await adapter.requestDevice({ requiredFeatures: canTimestamp ? ['timestamp-query'] : [] });
  const adapterArchitecture = adapter.info?.architecture ?? '';
  const context = canvas.getContext('webgpu');
  if (!context) throw new WebGPUUnavailableError('no webgpu canvas context');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'premultiplied' });

  let destroyed = false;
  device.lost.then((info) => {
    if (!destroyed) opts.onDeviceLost?.(info.message || info.reason);
  });
  device.onuncapturederror = (event) => {
    // eslint-disable-next-line no-console
    console.error('[cloth-lab] uncaptured WebGPU error:', event.error.message);
  };

  // Two timestamps bracketing the normals pass, resolved each frame and read
  // back without blocking the render loop (at most one read in flight).
  const tsQuery = canTimestamp ? device.createQuerySet({ type: 'timestamp', count: 2 }) : null;
  const tsResolve = canTimestamp
    ? device.createBuffer({ size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC })
    : null;
  const tsRead = canTimestamp
    ? device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
    : null;
  let tsInFlight = false;
  let gpuNormalsMs = 0;

  async function compile(label: string, code: string): Promise<GPUShaderModule> {
    const module = device.createShaderModule({ label, code });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      throw new Error(
        `WGSL compile error\n${errors.map((m) => `${label}:${m.lineNum}:${m.linePos} ${m.message}`).join('\n')}`,
      );
    }
    return module;
  }

  // One bind group layout shared by every compute pass.
  const computeLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 6, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      { binding: 7, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [computeLayout] });

  const computeModule = await compile('cloth.compute', clothComputeSrc);
  const integratePipeline = await device.createComputePipelineAsync({
    layout: pipelineLayout,
    compute: { module: computeModule, entryPoint: 'integrate' },
  });
  const normalsPipeline = await device.createComputePipelineAsync({
    layout: pipelineLayout,
    compute: { module: computeModule, entryPoint: 'computeNormals' },
  });
  const lraPipeline = await device.createComputePipelineAsync({
    layout: pipelineLayout,
    compute: { module: computeModule, entryPoint: 'applyLRA' },
  });
  const solvePipelines = await Promise.all(
    SOLVE_VARIANTS.map((constants) =>
      device.createComputePipelineAsync({
        layout: pipelineLayout,
        compute: { module: computeModule, entryPoint: 'solve', constants },
      }),
    ),
  );

  const renderModule = await compile('cloth.render', clothRenderSrc);
  const depthFormat: GPUTextureFormat = 'depth24plus';
  const renderPipeline = await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: {
      module: renderModule,
      entryPoint: 'vs',
      buffers: [
        { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] },
        { arrayStride: 12, attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }] },
      ],
    },
    fragment: { module: renderModule, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: depthFormat, depthWriteEnabled: true, depthCompare: 'less' },
  });

  const cameraBuffer = device.createBuffer({
    size: CAMERA_FLOATS * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const cameraData = new Float32Array(CAMERA_FLOATS);
  const cameraBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: cameraBuffer } }],
  });

  // sim uniform: 4 u32 header + 4 vec4<f32> = 80 bytes (see the Sim struct).
  const simBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const simHeader = new Uint32Array(4);
  const simFloats = new Float32Array(16); // gravity, wind, rest, sphere (4 x vec4)

  // --- per-grid state ------------------------------------------------------
  let grid: ClothGrid;
  let posBuffer: GPUBuffer;
  let prevBuffer: GPUBuffer;
  let normalsBuffer: GPUBuffer;
  let indexBuffer: GPUBuffer;
  let adjStartBuffer: GPUBuffer;
  let adjTrisBuffer: GPUBuffer;
  let lraBuffer: GPUBuffer;
  let computeBindGroup: GPUBindGroup;
  let posStaging: GPUBuffer;
  let depthTexture: GPUTexture | null = null;
  let pinStride = 2;

  let mode: NormalsMode = opts.normalsMode;
  let wind = opts.wind;
  let paused = false;
  // Solver iterations scale with the grid so corrections propagate the same
  // fraction of the cloth at every resolution. Without this, a high-res sheet is
  // under-solved and behaves as if it were heavier.
  let iterations = 12;
  let sphere = { x: 0, y: 0, z: 0, r: 0 };
  let lastInvMVP: Mat4 | null = null;
  let generation = 0; // bumped on every loadGrid, to fence stale async readbacks
  let time = 0;
  let fps = 60;
  let cpuNormalsMs = 0;
  let readbackBytes = 0;
  let lastNow = 0;

  function disposeGridBuffers() {
    posBuffer?.destroy();
    prevBuffer?.destroy();
    normalsBuffer?.destroy();
    indexBuffer?.destroy();
    adjStartBuffer?.destroy();
    adjTrisBuffer?.destroy();
    lraBuffer?.destroy();
    posStaging?.destroy();
  }

  // For each free particle, find its nearest pinned point and the rest distance
  // to it. The long-range-attachment pass then forbids the particle from ever
  // straying further than that, which bounds the drape the same way at every
  // resolution. Pins sit on the top row at every `pinStride`-th column.
  function buildLRA(): Float32Array {
    const { cols, rows, positions, restX, restY } = grid;
    const lra = new Float32Array(grid.vertexCount * 4);
    const pinCols: number[] = [];
    for (let c = 0; c < cols; c++) if (c % pinStride === 0 || c === cols - 1) pinCols.push(c);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = r * cols + c;
        let bestCol = pinCols[0];
        for (const pc of pinCols) if (Math.abs(pc - c) < Math.abs(bestCol - c)) bestCol = pc;
        const pin = bestCol; // pinned vertex is (row 0, col bestCol)
        // Geodesic (taut-path) distance to the pin, not Euclidean: this is how
        // far the particle can get when the chain of edges to the pin is pulled
        // straight, so the cloth drapes fully but never over-stretches. It is a
        // physical length, so it is the same at every resolution.
        const adx = Math.abs(c - pin);
        const diag = Math.min(adx, r);
        const straight = Math.abs(adx - r);
        const geodesic =
          diag * Math.hypot(restX, restY) + straight * (adx > r ? restX : restY);
        lra[v * 4] = positions[pin * 3];
        lra[v * 4 + 1] = positions[pin * 3 + 1];
        lra[v * 4 + 2] = positions[pin * 3 + 2];
        lra[v * 4 + 3] = geodesic * 1.01; // a hair of slack
      }
    }
    return lra;
  }

  function loadGrid(step: number) {
    // Bump the generation so any in-flight readback from the previous grid knows
    // its buffers are gone and bails instead of touching a destroyed buffer.
    generation++;
    disposeGridBuffers();
    const n = GRID_STEPS[Math.max(0, Math.min(step, GRID_STEPS.length - 1))];
    grid = makeClothGrid(n, n);
    iterations = Math.max(12, Math.min(32, Math.round(n / 18)));
    pinStride = Math.max(2, Math.floor((grid.cols - 1) / 9)); // ~10 pins across the top
    const byteLen = grid.positions.byteLength;

    posBuffer = device.createBuffer({
      size: byteLen,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(posBuffer, 0, grid.positions);
    prevBuffer = device.createBuffer({ size: byteLen, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(prevBuffer, 0, grid.positions); // start at rest (zero velocity)
    normalsBuffer = device.createBuffer({
      size: byteLen,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    indexBuffer = device.createBuffer({
      size: grid.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, grid.indices);
    adjStartBuffer = device.createBuffer({
      size: grid.adjacency.adjStart.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(adjStartBuffer, 0, grid.adjacency.adjStart);
    adjTrisBuffer = device.createBuffer({
      size: grid.adjacency.adjTris.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(adjTrisBuffer, 0, grid.adjacency.adjTris);
    posStaging = device.createBuffer({ size: byteLen, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

    const lraData = buildLRA();
    lraBuffer = device.createBuffer({ size: lraData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(lraBuffer, 0, lraData);

    computeBindGroup = device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: posBuffer } },
        { binding: 1, resource: { buffer: prevBuffer } },
        { binding: 2, resource: { buffer: normalsBuffer } },
        { binding: 3, resource: { buffer: indexBuffer } },
        { binding: 4, resource: { buffer: adjStartBuffer } },
        { binding: 5, resource: { buffer: adjTrisBuffer } },
        { binding: 6, resource: { buffer: simBuffer } },
        { binding: 7, resource: { buffer: lraBuffer } },
      ],
    });

    writeSim();
    // Prime the normals so the first frame is lit even before the sim runs.
    const enc = device.createCommandEncoder();
    encodeNormals(enc);
    device.queue.submit([enc.finish()]);
  }

  function writeSim() {
    simHeader[0] = grid.cols;
    simHeader[1] = grid.rows;
    simHeader[2] = grid.vertexCount;
    simHeader[3] = pinStride;
    // gravity.xyz + dt: firm, so the cloth hangs taut and the wind only ripples it
    simFloats.set([0, -4.0, 0, DT], 0);
    // wind.xyz + time: gentle, out of plane (+z), weaker than gravity
    const w = wind ? 1.0 : 0.0;
    simFloats.set([0.0, 0.0, 1.6 * w, time], 4);
    // rest: restX, restY, stiffness, damping.
    simFloats.set([grid.restX, grid.restY, STIFFNESS, 0.99], 8);
    // sphere xyz + radius
    simFloats.set([sphere.x, sphere.y, sphere.z, sphere.r], 12);
    device.queue.writeBuffer(simBuffer, 0, simHeader);
    device.queue.writeBuffer(simBuffer, 16, simFloats);
  }

  function encodeStep(encoder: GPUCommandEncoder) {
    {
      const pass = encoder.beginComputePass();
      pass.setPipeline(integratePipeline);
      pass.setBindGroup(0, computeBindGroup);
      pass.dispatchWorkgroups(Math.ceil(grid.vertexCount / 64));
      pass.end();
    }
    for (let it = 0; it < iterations; it++) {
      for (const pipeline of solvePipelines) {
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, computeBindGroup);
        pass.dispatchWorkgroups(Math.ceil(grid.vertexCount / 64));
        pass.end();
      }
      // Long-range attachment after each round: bounds the drape regardless of
      // how far the local constraints managed to propagate this frame.
      const lraPass = encoder.beginComputePass();
      lraPass.setPipeline(lraPipeline);
      lraPass.setBindGroup(0, computeBindGroup);
      lraPass.dispatchWorkgroups(Math.ceil(grid.vertexCount / 64));
      lraPass.end();
    }
  }

  function encodeNormals(encoder: GPUCommandEncoder, timed = false) {
    const pass = encoder.beginComputePass(
      timed && tsQuery
        ? { timestampWrites: { querySet: tsQuery, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 } }
        : {},
    );
    pass.setPipeline(normalsPipeline);
    pass.setBindGroup(0, computeBindGroup);
    pass.dispatchWorkgroups(Math.ceil(grid.vertexCount / 64));
    pass.end();
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
    // A gentle three-quarter view so the out-of-plane folds read as depth.
    const model = mul(rotationY(0.4), rotationX(0.08));
    const view = translation(0, 0.05, -5.0);
    const proj = perspective(Math.PI / 4, aspect, 0.1, 100);
    const mvp = mul(proj, mul(view, model));
    lastInvMVP = invert(mvp); // for mapping the cursor back into the cloth's space
    cameraData.set(mvp, 0);
    cameraData.set(model, 16);
    const l = normalize3(0.3, 0.6, 0.8);
    cameraData.set([l[0], l[1], l[2], 0], 32);
    device.queue.writeBuffer(cameraBuffer, 0, cameraData);
  }

  function encodeRender(encoder: GPUCommandEncoder, width: number, height: number) {
    ensureDepth(width, height);
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        { view: context!.getCurrentTexture().createView(), clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: 'clear', storeOp: 'store' },
      ],
      depthStencilAttachment: { view: depthTexture!.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store' },
    });
    pass.setPipeline(renderPipeline);
    pass.setBindGroup(0, cameraBindGroup);
    pass.setVertexBuffer(0, posBuffer);
    pass.setVertexBuffer(1, normalsBuffer);
    pass.setIndexBuffer(indexBuffer, 'uint32');
    pass.drawIndexed(grid.indices.length);
    pass.end();
  }

  function resize(): { width: number; height: number } {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { width, height };
  }

  let raf = 0;
  async function frame(now: number) {
    if (destroyed) return;
    if (lastNow) {
      const dt = now - lastNow;
      if (dt > 0) fps = fps * 0.9 + (1000 / dt) * 0.1;
    }
    lastNow = now;

    if (!paused) {
      time += DT;
      writeSim();
    }
    const { width, height } = resize();
    updateCamera(width, height);

    if (mode === 'gpu') {
      const enc = device.createCommandEncoder();
      if (!paused) encodeStep(enc);
      // Time the normals pass on the GPU when we are not already waiting on a
      // previous read, so the readout can show GPU-resident normals time.
      const timeNow = !!tsQuery && !tsInFlight;
      encodeNormals(enc, timeNow);
      if (timeNow && tsQuery && tsResolve && tsRead) {
        enc.resolveQuerySet(tsQuery, 0, 2, tsResolve, 0);
        enc.copyBufferToBuffer(tsResolve, 0, tsRead, 0, 16);
      }
      encodeRender(enc, width, height);
      device.queue.submit([enc.finish()]);
      readbackBytes = 0;
      if (timeNow && tsRead) {
        tsInFlight = true;
        tsRead.mapAsync(GPUMapMode.READ).then(() => {
          const t = new BigUint64Array(tsRead.getMappedRange().slice(0));
          tsRead.unmap();
          const ms = Number(t[1] - t[0]) / 1e6;
          if (ms > 0) gpuNormalsMs = ms;
          tsInFlight = false;
        }).catch(() => { tsInFlight = false; });
      }
    } else {
      // CPU mode: step on the GPU, pull positions back, compute normals in JS,
      // upload them, then render. The readback + JS work is the cost the post
      // measures against the resident GPU path.
      const gen = generation;
      const staging = posStaging; // the buffer for this frame's grid
      const enc1 = device.createCommandEncoder();
      if (!paused) encodeStep(enc1);
      enc1.copyBufferToBuffer(posBuffer, 0, staging, 0, staging.size);
      device.queue.submit([enc1.finish()]);

      let mapped = false;
      try {
        await staging.mapAsync(GPUMapMode.READ);
        mapped = true;
      } catch {
        // The grid changed (or the lab was destroyed) and this buffer was freed
        // before the map resolved. Drop this frame and let the next one run.
      }
      // Only use the result if it is still the current grid and we are alive.
      if (mapped && !destroyed && gen === generation) {
        const positions = new Float32Array(staging.getMappedRange().slice(0));
        staging.unmap();
        const t0 = performance.now();
        const normals = computeVertexNormals(positions, grid.indices);
        cpuNormalsMs = performance.now() - t0;
        readbackBytes = staging.size;
        device.queue.writeBuffer(normalsBuffer, 0, normals);
        const enc2 = device.createCommandEncoder();
        encodeRender(enc2, width, height);
        device.queue.submit([enc2.finish()]);
      } else if (mapped) {
        try { staging.unmap(); } catch { /* buffer already gone */ }
      }
    }

    if (!destroyed) raf = requestAnimationFrame((t) => void frame(t).catch(() => {}));
  }

  loadGrid(opts.gridStep);
  raf = requestAnimationFrame((t) => void frame(t).catch(() => {}));

  return {
    setGrid(step) {
      loadGrid(step);
    },
    setNormalsMode(next) {
      mode = next;
    },
    setWind(on) {
      wind = on;
      writeSim();
    },
    setPaused(on) {
      paused = on;
    },
    setPointer(ndcX, ndcY, active) {
      if (!active || !lastInvMVP) {
        sphere = { x: 0, y: 0, z: 0, r: 0 };
        writeSim();
        return;
      }
      // Unproject the cursor through the inverse view-projection and intersect
      // the cloth's rest plane (object z = 0), so the ball tracks the cursor
      // through the tilted camera. Sitting it just behind the plane makes it
      // bulge the cloth toward the viewer, and its radius reaches the sheet even
      // when it hangs flat (wind off) instead of only when the wind blows it in.
      const near = unproject(lastInvMVP, ndcX, ndcY, 0);
      const far = unproject(lastInvMVP, ndcX, ndcY, 1);
      const dz = far.z - near.z;
      const t = Math.abs(dz) > 1e-6 ? -near.z / dz : 0;
      sphere = {
        x: near.x + (far.x - near.x) * t,
        y: near.y + (far.y - near.y) * t,
        z: -0.2,
        r: 0.45,
      };
      writeSim();
    },
    stats: () => ({
      fps,
      triangles: grid.triangleCount,
      vertices: grid.vertexCount,
      mode,
      api: 'WGSL',
      cpuNormalsMs,
      gpuNormalsMs,
      readbackBytes,
    }),
    async verifyNormals() {
      // Freeze the RAF-driven stepping so the positions we read back are exactly
      // the ones the normals were computed from, not a frame or two later.
      const wasPaused = paused;
      paused = true;
      // Advance a few steps so the cloth is genuinely deformed, recompute GPU
      // normals, and diff against the CPU reference on identical positions.
      for (let i = 0; i < 8; i++) {
        time += DT;
        writeSim();
        const enc = device.createCommandEncoder();
        encodeStep(enc);
        device.queue.submit([enc.finish()]);
      }
      const enc = device.createCommandEncoder();
      encodeNormals(enc);
      enc.copyBufferToBuffer(normalsBuffer, 0, posStaging, 0, posStaging.size);
      device.queue.submit([enc.finish()]);
      await posStaging.mapAsync(GPUMapMode.READ);
      const gpuNormals = new Float32Array(posStaging.getMappedRange().slice(0));
      posStaging.unmap();

      // Read positions to compute the CPU reference and to confirm the cloth moved.
      const enc2 = device.createCommandEncoder();
      enc2.copyBufferToBuffer(posBuffer, 0, posStaging, 0, posStaging.size);
      device.queue.submit([enc2.finish()]);
      await posStaging.mapAsync(GPUMapMode.READ);
      const positions = new Float32Array(posStaging.getMappedRange().slice(0));
      posStaging.unmap();

      const cpu = computeVertexNormals(positions, grid.indices);
      let maxDelta = 0;
      for (let i = 0; i < cpu.length; i++) maxDelta = Math.max(maxDelta, Math.abs(cpu[i] - gpuNormals[i]));
      let movedFromRest = 0;
      for (let i = 0; i < positions.length; i++) {
        movedFromRest = Math.max(movedFromRest, Math.abs(positions[i] - grid.positions[i]));
      }
      paused = wasPaused;
      return { maxDelta, vertices: grid.vertexCount, movedFromRest };
    },
    async renderToPixels(size = 64): Promise<{ opaque: number; total: number }> {
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
      const read = device.createBuffer({ size: bytesPerRow * size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });

      updateCamera(size, size);
      const enc = device.createCommandEncoder();
      encodeNormals(enc);
      const pass = enc.beginRenderPass({
        colorAttachments: [{ view: color.createView(), clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: 'clear', storeOp: 'store' }],
        depthStencilAttachment: { view: depth.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store' },
      });
      pass.setPipeline(renderPipeline);
      pass.setBindGroup(0, cameraBindGroup);
      pass.setVertexBuffer(0, posBuffer);
      pass.setVertexBuffer(1, normalsBuffer);
      pass.setIndexBuffer(indexBuffer, 'uint32');
      pass.drawIndexed(grid.indices.length);
      pass.end();
      enc.copyTextureToBuffer({ texture: color }, { buffer: read, bytesPerRow }, { width: size, height: size });
      device.queue.submit([enc.finish()]);
      await read.mapAsync(GPUMapMode.READ);
      const px = new Uint8Array(read.getMappedRange().slice(0));
      read.unmap();
      read.destroy();
      color.destroy();
      depth.destroy();
      let opaque = 0;
      for (let i = 3; i < px.length; i += 4) if (px[i] > 16) opaque++;
      return { opaque, total: size * size };
    },
    adapterInfo: () => ({ architecture: adapterArchitecture }),
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      disposeGridBuffers();
      cameraBuffer.destroy();
      simBuffer.destroy();
      tsResolve?.destroy();
      tsRead?.destroy();
      tsQuery?.destroy();
      depthTexture?.destroy();
      try {
        context?.unconfigure();
      } catch {
        /* already gone */
      }
      device.destroy();
    },
  };
}

// --- minimal column-major mat4 helpers -------------------------------------
type Mat4 = Float32Array;
function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}
function rotationX(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m = new Float32Array(16);
  m[0] = 1; m[5] = c; m[6] = s; m[9] = -s; m[10] = c; m[15] = 1;
  return m;
}
function rotationY(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m = new Float32Array(16);
  m[0] = c; m[2] = -s; m[5] = 1; m[8] = s; m[10] = c; m[15] = 1;
  return m;
}
function translation(x: number, y: number, z: number): Mat4 {
  const m = new Float32Array(16);
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
  m[12] = x; m[13] = y; m[14] = z;
  return m;
}
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

// Full 4x4 inverse (column-major), for unprojecting the cursor. Returns the
// identity if the matrix is singular, which never happens for a real camera.
function invert(m: Mat4): Mat4 {
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  const o = new Float32Array(16);
  if (!det) { o[0] = o[5] = o[10] = o[15] = 1; return o; }
  det = 1 / det;
  o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return o;
}

// Map a clip-space point (ndc x, y in [-1,1], z in [0,1]) back to object space
// through an inverse MVP, dividing by w.
function unproject(inv: Mat4, x: number, y: number, z: number): { x: number; y: number; z: number } {
  const ox = inv[0] * x + inv[4] * y + inv[8] * z + inv[12];
  const oy = inv[1] * x + inv[5] * y + inv[9] * z + inv[13];
  const oz = inv[2] * x + inv[6] * y + inv[10] * z + inv[14];
  const ow = inv[3] * x + inv[7] * y + inv[11] * z + inv[15];
  const w = ow || 1;
  return { x: ox / w, y: oy / w, z: oz / w };
}
