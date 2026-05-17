import http from 'node:http';

const PORT = Number(process.env.PORT ?? 8080);
const GIT_SHA = process.env.GIT_SHA ?? 'unknown';
const SHUTDOWN_TIMEOUT_MS = 10_000;
const BOOT_AT = Date.now();

let state = 'starting';

async function bootCheck() {
  // Real dependency checks belong here (DB ping, cache warm, etc.).
  // No deps yet — ready immediately.
  state = 'ready';
}

function log(event, fields = {}) {
  process.stdout.write(JSON.stringify({ t: new Date().toISOString(), event, ...fields }) + '\n');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/healthz') {
    const ready = state === 'ready';
    res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: state, gitSha: GIT_SHA }));
    return;
  }

  if (url.pathname === '/' || url.pathname === '') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      service: 'filipkunc.com',
      gitSha: GIT_SHA,
      uptimeSec: Math.round((Date.now() - BOOT_AT) / 1000),
      phase: 1,
    }));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  log('listening', { port: PORT, gitSha: GIT_SHA });
  bootCheck()
    .then(() => log('ready', { gitSha: GIT_SHA }))
    .catch((err) => {
      log('boot_failed', { error: String(err) });
      process.exit(1);
    });
});

function shutdown(signal) {
  log('shutdown', { signal });
  state = 'draining';

  // Hard cap: if connections don't drain, force-exit so systemd can restart us.
  const killer = setTimeout(() => {
    log('shutdown_timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  killer.unref();

  server.close((err) => {
    if (err) {
      log('shutdown_close_error', { error: String(err) });
      process.exit(1);
    }
    log('stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
