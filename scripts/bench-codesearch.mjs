#!/usr/bin/env node
// Reproducible code-search benchmark for the code-search post.
//
//   npm run bench:codesearch
//
// Runs the same set of queries over a checkout of the Node.js source with five
// tools across three families:
//   - no index:   ripgrep, git grep        (brute-force scan)
//   - our index:  trigram/ (the Rust toy)  (trigram filter + verify)
//   - real index: google/codesearch, Zoekt, livegrep
// and records index build time, index size on disk, and warm query latency
// (best of N). Writes bench-results.json, which the post renders. Any tool whose
// binary is missing is skipped out loud; the committed JSON is what ships.
//
// Tool binaries are discovered on PATH and in a few well-known spots; override
// the corpus with CODESEARCH_CORPUS=/path/to/node.

import { execFileSync, execSync, spawnSync } from 'node:child_process';
import { existsSync, statSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const postDir = join(root, 'src/content/posts/code-search');
const outPath = join(postDir, 'bench-results.json');
const cache = join(homedir(), '.cache/codesearch-bench');

const corpus = process.env.CODESEARCH_CORPUS || join(cache, 'node-src');
if (!existsSync(corpus)) {
  console.error(`Corpus not found: ${corpus}`);
  console.error('Clone it first:  git clone --depth 1 https://github.com/nodejs/node.git ' + corpus);
  process.exit(1);
}

const which = (name) => {
  const r = spawnSync('sh', ['-c', `command -v ${name}`], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
};
const firstExisting = (...paths) => paths.find((p) => p && existsSync(p)) || null;
const dirSize = (p) =>
  Number(execSync(`du -sb ${JSON.stringify(p)} | cut -f1`, { encoding: 'utf8' }).trim());
const fileSize = (p) => statSync(p).size;

// Timed run: returns { ms, lines } for the best of `reps` (after `warmup`).
function timed(file, args, { reps = 5, warmup = 1, env = {} } = {}) {
  let best = Infinity;
  let lines = 0;
  for (let i = 0; i < warmup + reps; i++) {
    const t0 = process.hrtime.bigint();
    let out = '';
    try {
      out = execFileSync(file, args, {
        encoding: 'utf8',
        env: { ...process.env, ...env },
        maxBuffer: 1 << 28,
        timeout: 180_000,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch (e) {
      // grep-family tools exit 1 when there are no matches; that is not an error.
      out = e.stdout?.toString() ?? '';
    }
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (i >= warmup) {
      best = Math.min(best, ms);
      lines = out ? out.trimEnd().split('\n').filter(Boolean).length : 0;
    }
  }
  return { ms: +best.toFixed(2), lines };
}

// ---- queries ---------------------------------------------------------------
// A spread of selectivities: a common C++ symbol, a rare libuv symbol, an N-API
// function, a regex, and a very common word that matches almost everywhere.
const QUERIES = [
  { id: 'MakeCallback', pattern: 'MakeCallback', kind: 'literal' },
  { id: 'uv_async_init', pattern: 'uv_async_init', kind: 'literal' },
  { id: 'napi_create_function', pattern: 'napi_create_function', kind: 'literal' },
  { id: 'napi-regex', pattern: 'napi_create_[a-z]+', kind: 'regex' },
  { id: 'common-word', pattern: 'function', kind: 'literal' },
];

// ---- tool binaries ---------------------------------------------------------
const GOBIN = join(homedir(), 'go/bin');
const bins = {
  // `rg` is often a shell function (Claude Code injects one); resolve a real binary.
  rg: firstExisting(join(cache, 'bin/rg'), join(homedir(), '.cargo/bin/rg'), '/usr/bin/rg', which('rg')),
  git: which('git'),
  trigram: join(cache, 'trigram-target/release/trigram'),
  cindex: firstExisting(which('cindex'), join(GOBIN, 'cindex')),
  csearch: firstExisting(which('csearch'), join(GOBIN, 'csearch')),
  zoektIndex: firstExisting(which('zoekt-index'), join(GOBIN, 'zoekt-index')),
  zoekt: firstExisting(which('zoekt'), join(GOBIN, 'zoekt')),
  livegrep: firstExisting(
    join(cache, 'livegrep/bazel-out/k8-fastbuild/bin/src/tools/codesearch'),
    join(cache, 'livegrep/bazel-bin/src/tools/codesearch'),
  ),
};

// Build the Rust toy from the post's trigram/ project, if cargo is around.
function buildTrigram() {
  const dir = join(postDir, 'trigram');
  if (!which('cargo') || !existsSync(dir)) return null;
  console.log('Building trigram/ (release) ...');
  execSync('cargo build --release', {
    cwd: dir,
    stdio: 'inherit',
    env: { ...process.env, CARGO_TARGET_DIR: join(cache, 'trigram-target') },
  });
  return bins.trigram;
}

// ---- corpus stats ----------------------------------------------------------
console.log(`Corpus: ${corpus}`);
const corpusBytes = dirSize(corpus);
const corpusFiles = Number(
  execSync(`find ${JSON.stringify(corpus)} -type f -not -path '*/.git/*' | wc -l`, {
    encoding: 'utf8',
  }).trim(),
);
const corpusLines = Number(
  execSync(
    `find ${JSON.stringify(corpus)} -type f -not -path '*/.git/*' -print0 | xargs -0 cat 2>/dev/null | wc -l`,
    { encoding: 'utf8', maxBuffer: 1 << 30 },
  ).trim(),
);
console.log(
  `  ${corpusFiles.toLocaleString()} files, ${(corpusLines / 1e6).toFixed(1)}M lines, ${(corpusBytes / 1e9).toFixed(2)} GB`,
);

const results = { corpus: {}, tools: [] };
results.corpus = { files: corpusFiles, lines: corpusLines, bytes: corpusBytes };

// ---- index builds ----------------------------------------------------------
buildTrigram();

function buildIndex(name, fn) {
  try {
    const t0 = process.hrtime.bigint();
    const size = fn();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`  ${name}: built in ${(ms / 1000).toFixed(1)}s, index ${(size / 1e6).toFixed(0)} MB`);
    return { buildMs: +ms.toFixed(0), indexBytes: size };
  } catch (e) {
    console.log(`  ${name}: index build failed (${String(e.message).split('\n')[0]})`);
    return null;
  }
}

console.log('\nBuilding indexes ...');
const tmp = mkdtempSync(join(tmpdir(), 'csbench-'));
const idx = {};

if (bins.trigram && existsSync(bins.trigram)) {
  idx.trigram = buildIndex('trigram (ours)', () => {
    const f = join(tmp, 'our.idx');
    execFileSync(bins.trigram, ['index', corpus, '--out', f], { stdio: 'ignore' });
    return fileSize(f);
  });
  idx.trigram && (idx.trigram.path = join(tmp, 'our.idx'));
}
if (bins.cindex) {
  idx.codesearch = buildIndex('google/codesearch', () => {
    const f = join(tmp, 'csearch.index');
    execFileSync(bins.cindex, [corpus], { stdio: 'ignore', env: { ...process.env, CSEARCHINDEX: f } });
    return fileSize(f);
  });
  idx.codesearch && (idx.codesearch.path = join(tmp, 'csearch.index'));
}
if (bins.zoektIndex) {
  idx.zoekt = buildIndex('zoekt', () => {
    const d = join(tmp, 'zoekt');
    execSync(`mkdir -p ${JSON.stringify(d)}`);
    execFileSync(bins.zoektIndex, ['-index', d, corpus], { stdio: 'ignore' });
    return dirSize(d);
  });
  idx.zoekt && (idx.zoekt.dir = join(tmp, 'zoekt'));
}
if (bins.livegrep) {
  idx.livegrep = buildIndex('livegrep', () => {
    const f = join(tmp, 'livegrep.idx');
    const cfg = join(tmp, 'lg.json');
    writeFileSync(
      cfg,
      JSON.stringify({
        name: 'node',
        repositories: [{ name: 'node', path: corpus, revisions: ['HEAD'] }],
      }),
    );
    execFileSync(bins.livegrep, ['-dump_index', f, '-index_only', cfg], { stdio: 'ignore' });
    return fileSize(f);
  });
  idx.livegrep && (idx.livegrep.path = join(tmp, 'livegrep.idx'));
}

// ---- query latency ---------------------------------------------------------
console.log('\nRunning queries (best of 5) ...');

function runTool(name, build, queryFor) {
  if (!queryFor) return;
  const queries = QUERIES.map((q) => {
    const spec = queryFor(q);
    if (!spec) return { id: q.id, skipped: true };
    const { ms, lines } = timed(spec.file, spec.args, { env: spec.env });
    return { id: q.id, ms, matches: lines };
  });
  const entry = { name, family: build?.family ?? 'noindex', ...(build ?? {}), queries };
  delete entry.path;
  delete entry.dir;
  results.tools.push(entry);
  const summary = queries
    .filter((q) => !q.skipped)
    .map((q) => `${q.id}=${q.ms}ms`)
    .join('  ');
  console.log(`  ${name}: ${summary}`);
}

// no-index scanners
if (bins.rg) {
  runTool('ripgrep', { family: 'noindex' }, (q) => ({
    file: bins.rg,
    args: ['-l', ...(q.kind === 'regex' ? [] : ['-F']), q.pattern, corpus],
  }));
}
if (bins.git) {
  runTool('git grep', { family: 'noindex' }, (q) => ({
    file: bins.git,
    args: ['-C', corpus, 'grep', '-I', '-l', ...(q.kind === 'regex' ? ['-E'] : ['-F']), q.pattern],
  }));
}
// our trigram toy
if (idx.trigram) {
  runTool('trigram (ours)', { family: 'ours', ...idx.trigram }, (q) => ({
    file: bins.trigram,
    args: ['search', q.pattern, '--index', idx.trigram.path],
  }));
  // Second pass for the internal numbers `--stats` prints to stderr: how much
  // the trigram filter prunes, and how long that filter takes on its own (the
  // wall-clock above is dominated by reading our naive 231 MB index per spawn).
  const entry = results.tools.find((t) => t.name === 'trigram (ours)');
  for (const q of QUERIES) {
    const r = spawnSync(
      bins.trigram,
      ['search', q.pattern, '--index', idx.trigram.path, '--stats'],
      { encoding: 'utf8', maxBuffer: 1 << 28 },
    );
    const cand = r.stderr.match(/candidates: (\d+) of (\d+) files \(([\d.]+)%\)/);
    const filt = r.stderr.match(/filter: ([\d.]+)ms, total: ([\d.]+)ms/);
    const target = entry.queries.find((x) => x.id === q.id);
    if (target && cand) {
      target.candidates = +cand[1];
      target.candidatePct = +cand[3];
    }
    if (target && filt) {
      target.filterMs = +filt[1];
    }
  }
}
// real indexes
if (idx.codesearch) {
  runTool('google/codesearch', { family: 'index', ...idx.codesearch }, (q) => ({
    file: bins.csearch,
    args: ['-l', q.pattern],
    env: { CSEARCHINDEX: idx.codesearch.path },
  }));
}
if (idx.zoekt) {
  runTool('zoekt', { family: 'index', ...idx.zoekt }, (q) => ({
    file: bins.zoekt,
    args: ['-index_dir', idx.zoekt.dir, '-l', q.pattern],
  }));
}
// livegrep query needs its gRPC backend; we record build/size only and note it.
if (idx.livegrep) {
  results.tools.push({
    name: 'livegrep',
    family: 'index',
    buildMs: idx.livegrep.buildMs,
    indexBytes: idx.livegrep.indexBytes,
    queries: [],
    note: 'index build + size only; queries run through the gRPC backend',
  });
  console.log('  livegrep: index build + size recorded (query path needs the backend)');
}

results.generatedOn = process.env.BENCH_DATE || new Date().toISOString().slice(0, 10);
results.host = {
  cpu: execSync("grep -m1 'model name' /proc/cpuinfo | cut -d: -f2", { encoding: 'utf8' }).trim(),
  cores: Number(execSync('nproc', { encoding: 'utf8' }).trim()),
};

writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n');
rmSync(tmp, { recursive: true, force: true });
console.log(`\nWrote ${outPath}`);
