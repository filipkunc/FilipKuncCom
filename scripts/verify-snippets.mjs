#!/usr/bin/env node
// Walks src/content/posts/<slug>/verify/<lang>/ folders, runs each run.sh,
// captures stdout, writes a manifest the MDX components import.
//
// Convention: every verify/<lang>/ contains a run.sh that prints the
// snippet's output to stdout. The verifier is language-agnostic; toolchain
// quirks live inside each run.sh.
//
// The manifest is checked in — run `npm run verify` locally before pushing.
// The deploy image (node:alpine) does not have rustc/cargo, so verification
// happens on the dev machine and the manifest ships as committed content.

import { spawnSync } from 'node:child_process';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const postsDir = join(root, 'src/content/posts');
const cacheDir = join(root, '.cache/verify');
const manifestPath = join(root, 'snippet-manifest.json');
const timeoutMs = 60_000;

mkdirSync(cacheDir, { recursive: true });

const failures = [];
const manifest = {};

for (const post of readdirSync(postsDir, { withFileTypes: true })) {
  if (!post.isDirectory()) continue;
  const verifyDir = join(postsDir, post.name, 'verify');
  if (!existsSync(verifyDir)) continue;

  for (const lang of readdirSync(verifyDir, { withFileTypes: true })) {
    if (!lang.isDirectory()) continue;
    const langDir = join(verifyDir, lang.name);
    const runScript = join(langDir, 'run.sh');
    if (!existsSync(runScript)) {
      failures.push(`${post.name}/${lang.name}: missing run.sh`);
      continue;
    }

    const key = `${post.name}/${lang.name}`;
    const langCacheDir = join(cacheDir, lang.name);
    mkdirSync(langCacheDir, { recursive: true });

    process.stdout.write(`verify ${key} ... `);
    const started = Date.now();
    const result = spawnSync('sh', [runScript], {
      cwd: langDir,
      env: {
        ...process.env,
        CARGO_TARGET_DIR: join(langCacheDir, 'target'),
      },
      encoding: 'utf8',
      timeout: timeoutMs,
    });
    const durationMs = Date.now() - started;

    if (result.error) {
      console.log(`FAIL (${result.error.message})`);
      failures.push(`${key}: ${result.error.message}`);
      continue;
    }
    if (result.status !== 0) {
      console.log(`FAIL (exit ${result.status})`);
      if (result.stderr) process.stderr.write(result.stderr);
      failures.push(`${key}: exit ${result.status}`);
      continue;
    }

    console.log(`ok (${durationMs}ms)`);
    manifest[key] = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.status,
      durationMs,
      verifiedAt: new Date().toISOString(),
    };
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nWrote ${manifestPath} (${Object.keys(manifest).length} entries)`);

if (failures.length > 0) {
  console.error(`\n${failures.length} snippet(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
