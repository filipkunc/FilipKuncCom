// Precompresses compressible dist/ assets to .br and .gz siblings at build
// time, so the static server can serve them with zero runtime CPU. Skips
// already-compressed formats (images, video, woff2).
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const DIST = new URL('../dist/', import.meta.url).pathname;
const COMPRESSIBLE = new Set([
  '.html', '.js', '.mjs', '.css', '.svg', '.json', '.xml', '.txt',
  '.wasm', '.ttf', '.map', '.ico',
]);
const MIN_BYTES = 1024;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let files = 0;
let before = 0;
let afterBr = 0;
for await (const file of walk(DIST)) {
  if (!COMPRESSIBLE.has(extname(file))) continue;
  const { size } = await stat(file);
  if (size < MIN_BYTES) continue;
  const data = await readFile(file);
  const br = brotliCompressSync(data, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
    },
  });
  const gz = gzipSync(data, { level: 9 });
  // Only keep variants that actually save space.
  if (br.length < size) await writeFile(`${file}.br`, br);
  if (gz.length < size) await writeFile(`${file}.gz`, gz);
  files++;
  before += size;
  afterBr += Math.min(br.length, size);
}

console.log(
  `compress-dist: ${files} files, ${(before / 1024).toFixed(0)} KB -> ` +
  `${(afterBr / 1024).toFixed(0)} KB (brotli)`,
);
