#!/usr/bin/env node
// Reproducible allocator benchmark for the data-races post.
//
//   npm run bench:alloc
//
// Compiles code/alloc_bench.cpp and runs it, timing allocate + touch + free for
// four allocators (new/delete, a mutex pool, a lock-free pool, and one pool per
// thread) across a range of thread counts. Parses the RESULT lines, prints a
// table, and writes bench-results.json, which the post renders. clang++ is the
// only toolchain it needs; if it is missing the script says so and stops. The
// committed JSON is what ships -- the deploy image never compiles this.

import { execFileSync, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const codeDir = join(root, 'src/content/posts/cpp-data-races/code');
const outPath = join(root, 'src/content/posts/cpp-data-races/bench-results.json');

const tryCmd = (cmd) => {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
};

if (!tryCmd('which clang++')) {
  console.error('clang++ not found. Install it (the post commits the JSON this would produce).');
  process.exit(1);
}

const bin = join(tmpdir(), 'alloc_bench');
console.log('Building alloc_bench.cpp ...');
execSync(`clang++ -std=c++23 -O3 -pthread -I. alloc_bench.cpp -o ${bin}`, { cwd: codeDir, stdio: 'inherit' });

console.log('Running (best of 3 per point) ...\n');
const out = execFileSync(bin, { encoding: 'utf8', timeout: 300_000 });

const meta = {};
const results = [];
for (const line of out.split('\n')) {
  const h = line.match(/^CPU threads=(\d+) block=(\d+) iters=(\d+) bestof=(\d+)/);
  if (h) { meta.cpuThreads = +h[1]; meta.block = +h[2]; meta.iters = +h[3]; meta.bestOf = +h[4]; continue; }
  const m = line.match(/^RESULT impl=(\S+) threads=(\d+) ns_per_op=([\d.]+) mops=([\d.]+)/);
  if (m) results.push({ impl: m[1], threads: +m[2], nsPerOp: +m[3], mops: +m[4] });
}
if (results.length === 0) { console.error(`No RESULT lines:\n${out}`); process.exit(1); }

// tcmalloc demo: the exact same new/delete binary, with the gperftools allocator
// swapped in via LD_PRELOAD. No recompile, no code change. Skipped out loud if
// the library is not installed, and the rows are only kept if the binary
// confirms tcmalloc actually loaded (the loader silently ignores a preload it
// cannot use, which would otherwise leave plain new/delete mislabelled).
function findTcmalloc() {
  const out = tryCmd('ldconfig -p') || '';
  // Match the canonical soname (libtcmalloc.so[.N]), not the _minimal/_debug/
  // _and_profiler variants, anchored on the path so a stray substring can't slip in.
  const line = out
    .split('\n')
    .map((l) => l.split('=>')[1]?.trim())
    .find((p) => p && /\/libtcmalloc\.so(\.\d+)*$/.test(p));
  return line ?? null;
}
let tcmallocPath = findTcmalloc();
if (tcmallocPath) {
  console.log(`Re-running new/delete under LD_PRELOAD=${tcmallocPath} ...\n`);
  const tout = execFileSync(bin, ['new-only'], {
    encoding: 'utf8', timeout: 300_000, env: { ...process.env, LD_PRELOAD: tcmallocPath },
  });
  if (!/^ALLOC active=tcmalloc$/m.test(tout)) {
    console.log('  preload did not take effect (binary reports system allocator); skipping tcmalloc column.');
    tcmallocPath = null;
  } else {
    for (const line of tout.split('\n')) {
      const m = line.match(/^RESULT impl=new threads=(\d+) ns_per_op=([\d.]+) mops=([\d.]+)/);
      if (m) results.push({ impl: 'tcmalloc', threads: +m[1], nsPerOp: +m[2], mops: +m[3] });
    }
  }
} else {
  console.log('libtcmalloc.so not found; skipping the tcmalloc column.');
}
const hasTcmalloc = results.some((r) => r.impl === 'tcmalloc');

// google/tcmalloc (per-CPU, restartable sequences). A different library than
// gperftools: Bazel-only and statically linked, so it cannot be LD_PRELOADed.
// bench/tcmalloc/ builds the same alloc_bench.cpp against it. Skipped out loud if
// Bazel is missing; the static link guarantees the rows really are tcmalloc.
if (tryCmd('which bazel') || tryCmd('which bazelisk')) {
  const dir = join(root, 'bench/tcmalloc');
  try {
    console.log('\nBuilding the same source against google/tcmalloc via Bazel ...');
    execSync('bazel build //:alloc_bench', { cwd: dir, stdio: 'inherit' });
    const pout = execFileSync(join(dir, 'bazel-bin/alloc_bench'), ['new-only'], { encoding: 'utf8', timeout: 300_000 });
    for (const line of pout.split('\n')) {
      const m = line.match(/^RESULT impl=new threads=(\d+) ns_per_op=([\d.]+) mops=([\d.]+)/);
      if (m) results.push({ impl: 'percpu', threads: +m[1], nsPerOp: +m[2], mops: +m[3] });
    }
  } catch (e) {
    console.log(`  Bazel build/run failed; skipping the per-CPU tcmalloc column. (${String(e.message).split('\n')[0]})`);
  }
} else {
  console.log('bazel not found; skipping the per-CPU tcmalloc column.');
}
const hasPercpu = results.some((r) => r.impl === 'percpu');

const impls = [
  { key: 'new', label: 'new / delete' },
  ...(hasTcmalloc ? [{ key: 'tcmalloc', label: 'tcmalloc (gperftools)' }] : []),
  ...(hasPercpu ? [{ key: 'percpu', label: 'tcmalloc (Google)' }] : []),
  { key: 'atomic', label: 'shared arena' },
  { key: 'threadlocal', label: 'thread-local arena' },
];
const threadCounts = [...new Set(results.map((r) => r.threads))].sort((a, b) => a - b);

// Table to stdout: rows are thread counts, columns are implementations, M ops/s.
const padL = (s, n) => String(s).padStart(n);
const cell = (impl, t) => {
  const r = results.find((x) => x.impl === impl && x.threads === t);
  return r ? r.mops.toFixed(0) : '-';
};
console.log(padL('threads', 9) + impls.map((i) => padL(i.label, 20)).join(''));
console.log('-'.repeat(9 + impls.length * 20));
for (const t of threadCounts) {
  console.log(padL(t, 9) + impls.map((i) => padL(cell(i.key, t) + ' M/s', 20)).join(''));
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedOn: new Date().toISOString().slice(0, 10),
      cpuThreads: meta.cpuThreads,
      block: meta.block,
      iters: meta.iters,
      bestOf: meta.bestOf,
      tcmalloc: hasTcmalloc,
      tcmallocPath: hasTcmalloc ? tcmallocPath : null,
      percpu: hasPercpu,
      threadCounts,
      impls,
      results,
    },
    null,
    2,
  ) + '\n',
);
console.log(`\nWrote ${outPath}`);
