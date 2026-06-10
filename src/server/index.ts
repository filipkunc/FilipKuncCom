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
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
};

// HTTP Range header: "bytes=START-END" (END optional). Returns [start, end] within fileSize bounds.
function parseRange(header: string | undefined, fileSize: number): [number, number] | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const startStr = m[1] ?? '';
  const endStr = m[2] ?? '';
  let start: number;
  let end: number;
  if (startStr === '' && endStr !== '') {
    // suffix-range: last N bytes
    const n = Number(endStr);
    if (!Number.isFinite(n) || n <= 0) return null;
    start = Math.max(0, fileSize - n);
    end = fileSize - 1;
  } else if (startStr !== '') {
    start = Number(startStr);
    end = endStr === '' ? fileSize - 1 : Number(endStr);
  } else {
    return null;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || end < start || start >= fileSize) return null;
  end = Math.min(end, fileSize - 1);
  return [start, end];
}

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

  // Precompressed siblings (.br/.gz, written by scripts/compress-dist.mjs).
  // Range requests bypass this: ranges address the identity encoding.
  if (!req.headers.range) {
    const accepted = (req.headers['accept-encoding'] ?? '').toString();
    for (const [enc, suffix] of [['br', '.br'], ['gzip', '.gz']] as const) {
      if (!new RegExp(`\\b${enc}\\b`).test(accepted)) continue;
      try {
        const cstat = await fs.stat(file + suffix);
        res.writeHead(200, {
          'content-type': mime,
          'content-length': String(cstat.size),
          'content-encoding': enc,
          vary: 'accept-encoding',
          'cache-control': cacheHeaderFor(file),
          'x-git-sha': GIT_SHA,
        });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        createReadStream(file + suffix).pipe(res);
        return;
      } catch {
        /* no precompressed sibling for this encoding */
      }
    }
  }

  const stat = await fs.stat(file);
  const fileSize = stat.size;

  // Range request — required for <video> seeking and for browsers to begin
  // playback before downloading the whole file.
  const range = parseRange(req.headers.range, fileSize);
  if (range) {
    const [start, end] = range;
    res.writeHead(206, {
      'content-type': mime,
      'content-length': String(end - start + 1),
      'content-range': `bytes ${start}-${end}/${fileSize}`,
      'accept-ranges': 'bytes',
      'cache-control': cacheHeaderFor(file),
      'x-git-sha': GIT_SHA,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'content-type': mime,
    'content-length': String(fileSize),
    'accept-ranges': 'bytes',
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
