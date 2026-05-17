import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Runtime layout: /app/server-dist/index.js + /app/dist/*
const DIST = path.resolve(__dirname, '..', 'dist');

const PORT = Number(process.env.PORT ?? 8080);
const GIT_SHA = process.env.GIT_SHA ?? 'unknown';
const SHUTDOWN_TIMEOUT_MS = 10_000;
const BOOT_AT = Date.now();

type State = 'starting' | 'ready' | 'draining';
let state: State = 'starting';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json',
  '.pdf': 'application/pdf',
};

function log(event: string, fields: Record<string, unknown> = {}): void {
  process.stdout.write(JSON.stringify({ t: new Date().toISOString(), event, ...fields }) + '\n');
}

async function bootCheck(): Promise<void> {
  // Real readiness: the static site must actually be on disk.
  await fs.access(path.join(DIST, 'index.html'));
  state = 'ready';
}

async function resolveFile(urlPath: string): Promise<string | null> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  const safe = path.posix.normalize(decoded);
  if (safe.startsWith('..')) return null;

  const direct = path.join(DIST, safe);
  // Ensure resolved path stays under DIST (defense against tricky inputs).
  const rel = path.relative(DIST, direct);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;

  const candidates: string[] = [direct];
  if (!path.extname(safe) || safe.endsWith('/')) {
    candidates.push(path.join(direct, 'index.html'));
    candidates.push(direct.replace(/\/$/, '') + '.html');
  }

  for (const c of candidates) {
    try {
      const stat = await fs.stat(c);
      if (stat.isFile()) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

function cacheHeaderFor(filePath: string): string {
  // Astro fingerprints assets inside /_astro/ — safe to cache forever.
  if (filePath.includes(`${path.sep}_astro${path.sep}`)) {
    return 'public, max-age=31536000, immutable';
  }
  if (filePath.endsWith('.html')) {
    return 'public, max-age=0, must-revalidate';
  }
  return 'public, max-age=3600';
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (url.pathname === '/healthz') {
    const ready = state === 'ready';
    res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: state, gitSha: GIT_SHA }));
    return;
  }

  if (url.pathname === '/_app/version') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        gitSha: GIT_SHA,
        uptimeSec: Math.round((Date.now() - BOOT_AT) / 1000),
      }),
    );
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' });
    res.end();
    return;
  }

  const file = await resolveFile(url.pathname);
  if (!file) {
    const fallback = path.join(DIST, '404.html');
    try {
      await fs.access(fallback);
      res.writeHead(404, {
        'content-type': 'text/html; charset=utf-8',
        'x-git-sha': GIT_SHA,
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      createReadStream(fallback).pipe(res);
      return;
    } catch {
      /* no 404.html */
    }
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
    return;
  }

  const ext = path.extname(file).toLowerCase();
  const mime = MIME[ext] ?? 'application/octet-stream';
  res.writeHead(200, {
    'content-type': mime,
    'cache-control': cacheHeaderFor(file),
    'x-git-sha': GIT_SHA,
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  log('listening', { port: PORT, gitSha: GIT_SHA, dist: DIST });
  bootCheck()
    .then(() => log('ready', { gitSha: GIT_SHA }))
    .catch((err: unknown) => {
      log('boot_failed', { error: String(err) });
      process.exit(1);
    });
});

function shutdown(signal: string): void {
  log('shutdown', { signal });
  state = 'draining';

  const killer = setTimeout(() => {
    log('shutdown_timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  killer.unref();

  server.close((err) => {
    if (err) {
      log('shutdown_close_error', { error: String(err) });
      process.exit(1);
      return;
    }
    log('stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
