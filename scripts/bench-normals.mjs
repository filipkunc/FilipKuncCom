#!/usr/bin/env node
// Reproducible cross-toolchain benchmark for per-vertex normals.
//
//   npm run bench
//
// Generates one shared mesh, then compiles and runs the same gather kernel in
// JavaScript, WGSL, CUDA, OpenCL, and Slang, timing each and checking that
// their checksums agree. Prints a table and writes bench-results.json, which
// the post renders. Any toolchain that is missing is skipped out loud, never
// silently. GPU runners build only where the toolchains exist (e.g. the dev
// machine); the committed JSON is what ships.

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const benchDir = join(root, 'bench/normals');
const outPath = join(root, 'src/content/posts/gpu-normals/bench-results.json');

const sh = (cmd, opts = {}) => execSync(cmd, { cwd: benchDir, stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString();
const tryCmd = (cmd) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } };

function detectCuda() {
  let path = process.env.CUDA_HOME || process.env.CUDA_PATH || null;
  if (!path) { const n = tryCmd('which nvcc'); if (n) path = dirname(dirname(n)); }
  if (!path && existsSync('/usr/local/cuda')) path = '/usr/local/cuda';
  let arch = 'sm_120';
  const cc = tryCmd('nvidia-smi --query-gpu=compute_cap --format=csv,noheader');
  if (cc) arch = 'sm_' + cc.split('\n')[0].trim().replace('.', '');
  return { path, arch, hasClang: !!tryCmd('which clang++'), hasCc: !!tryCmd('which cc') };
}
function findSlangc() {
  const local = join(benchDir, '../../.tools/slang/bin/slangc');
  if (existsSync(local)) return local;
  return tryCmd('which slangc');
}

const cuda = detectCuda();
const slangc = findSlangc();

// Each runner: how to build (optional) and how to run, plus whether its
// toolchain is present. label is what shows in the table.
const runners = [
  {
    lang: 'js', label: 'JavaScript', available: true,
    run: () => sh('node run-js.mjs'),
  },
  {
    lang: 'wgsl', label: 'WGSL (WebGPU)', available: true,
    run: () => sh('node run-wgsl.mjs', { timeout: 180_000 }),
  },
  {
    lang: 'cuda', label: 'CUDA', available: !!(cuda.path && cuda.hasClang),
    why: 'needs clang++ and a CUDA toolkit',
    build: () => sh(`clang++ -O3 -x cuda --cuda-gpu-arch=${cuda.arch} --cuda-path=${cuda.path} run-cuda.cu -o run-cuda -L${cuda.path}/lib64 -lcudart -ldl -lrt -pthread 2>/dev/null`),
    run: () => sh('./run-cuda mesh.bin'),
  },
  {
    lang: 'opencl', label: 'OpenCL', available: !!(cuda.path && cuda.hasCc && existsSync(join(cuda.path || '', 'include/CL/cl.h'))),
    why: 'needs an OpenCL header + ICD loader',
    build: () => sh(`cc -O3 -I${cuda.path}/include run-opencl.c -o run-opencl -L${cuda.path}/lib64 -lOpenCL`),
    run: () => sh('./run-opencl mesh.bin run-opencl.cl'),
  },
  {
    lang: 'slang', label: 'Slang', available: !!(slangc && cuda.path && cuda.hasCc),
    why: 'needs slangc + the CUDA driver',
    build: () => {
      sh(`${slangc} run-slang.slang -target ptx -stage compute -entry computeMain -o run-slang.ptx`);
      sh(`cc -O3 -I${cuda.path}/include run-slang-host.c -o run-slang-host -L/usr/lib -L/usr/lib64 -lcuda`);
    },
    run: () => sh('./run-slang-host mesh.bin run-slang.ptx'),
  },
];

function parse(line) {
  const m = line.match(
    /RESULT lang=(\S+) device="([^"]*)"(?: masked=([01]))? vertices=(\d+) triangles=(\d+) ms=([\d.]+) checksum=([\d.-]+)/,
  );
  if (!m) return null;
  return { lang: m[1], device: m[2], masked: m[3] === '1', vertices: +m[4], triangles: +m[5], ms: +m[6], checksum: +m[7] };
}

console.log('Generating shared mesh...');
sh('node gen-mesh.mjs');

const results = [];
for (const r of runners) {
  if (!r.available) { console.log(`- ${r.label}: skipped (${r.why})`); continue; }
  try {
    process.stdout.write(`- ${r.label}: `);
    if (r.build) r.build();
    const out = r.run();
    const parsed = parse(out.split('\n').find((l) => l.startsWith('RESULT')) || '');
    if (!parsed) throw new Error(`no RESULT line:\n${out}`);
    results.push({ ...parsed, label: r.label });
    console.log(`${parsed.ms.toFixed(3)} ms on ${parsed.device}`);
  } catch (e) {
    console.log(`FAILED (${String(e.message).split('\n')[0]})`);
  }
}

if (results.length === 0) { console.error('No runners succeeded.'); process.exit(1); }

// Correctness: every checksum must match the first within a small tolerance.
const ref = results[0].checksum;
for (const r of results) {
  r.checksumOk = Math.abs(r.checksum - ref) < Math.max(1, Math.abs(ref) * 1e-4);
}
const baseline = results.find((r) => r.lang === 'js') ?? results[0];
for (const r of results) {
  r.throughputMVerts = r.vertices / (r.ms / 1000) / 1e6; // million vertices / second
  r.speedupVsBaseline = baseline.ms / r.ms;
}

// Table.
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
console.log('\n' + pad('kernel', 16) + pad('device', 30) + padL('ms', 10) + padL('Mverts/s', 12) + padL('vs JS', 8) + '  ok');
console.log('-'.repeat(80));
for (const r of results) {
  console.log(
    pad(r.label, 16) + pad(r.device.slice(0, 28), 30) +
    padL(r.ms.toFixed(3), 10) + padL(r.throughputMVerts.toFixed(0), 12) +
    padL(r.speedupVsBaseline >= 1 ? r.speedupVsBaseline.toFixed(0) + 'x' : r.speedupVsBaseline.toFixed(2) + 'x', 8) +
    '  ' + (r.checksumOk ? 'yes' : 'NO'),
  );
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedOn: new Date().toISOString().slice(0, 10),
      mesh: { vertices: results[0].vertices, triangles: results[0].triangles },
      baselineLang: baseline.lang,
      results: results.map((r) => ({
        lang: r.lang, label: r.label, device: r.device, deviceMasked: !!r.masked, ms: r.ms,
        throughputMVerts: r.throughputMVerts, speedupVsBaseline: r.speedupVsBaseline, checksumOk: r.checksumOk,
      })),
    },
    null,
    2,
  ) + '\n',
);
console.log(`\nWrote ${outPath}`);
