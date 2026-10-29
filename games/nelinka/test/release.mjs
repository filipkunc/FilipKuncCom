import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readlink, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const target = await readlink('public/nelinka');
assert.match(target, /^\.\.\/games\/nelinka\/releases\/[a-f0-9]{12}$/);
const root = resolve('public', target);
const manifest = JSON.parse(await readFile(join(root, 'release.json'), 'utf8'));
assert.equal(manifest.repository, 'https://github.com/filipkunc/Nelinka');
assert.ok(target.endsWith(manifest.commit.slice(0,12)));
assert.equal(manifest.chapters.length, 5);
for (const [name, hash] of Object.entries(manifest.sha256)) {
  assert.ok(!name.startsWith('/') && !name.split('/').includes('..'));
  assert.equal(createHash('sha256').update(await readFile(join(root, name))).digest('hex'), hash, name);
}
const files = (await readdir(root, {recursive:true,withFileTypes:true})).filter(e=>e.isFile());
assert.equal(files.length,Object.keys(manifest.sha256).length+1);
assert.match(await readFile(join(root,'index.html'),'utf8'),/player\.js/);
assert.match(await readFile(join(root,'workshop.html'),'utf8'),/level editor/);
assert.equal(await readlink('public/nelinka-classic'),'../games/nelinka/public');
console.log(`Pinned Nelinka ${manifest.commit.slice(0,12)}: ${files.length} release files verified`);

const revision = manifest.commit.slice(0,12);
for (const page of ['index.html','workshop.html']) {
  assert.ok((await readFile(join(root,page),'utf8')).includes('loader.js?v='+revision), page+' must request the pinned loader');
}
const startup = await readFile(join(root,'loader.js'),'utf8');
assert.ok(startup.includes("new URL(import.meta.url).search"), 'startup must propagate its pinned revision');
assert.ok(manifest.sha256['nelinka_bg.wasm.gz'], 'manifest must cover compressed WASM');
const loader = await readFile(join(root,'nelinka.js'),'utf8');
assert.ok(loader.includes('nelinka_bg.wasm?v='+revision), 'loader must request the pinned WASM revision');
assert.ok(manifest.sha256['nelinka_bg.wasm'], 'manifest must cover the WASM module');
const snippets = Object.keys(manifest.sha256).filter(name => name.startsWith('snippets/') && name.endsWith('.js'));
assert.ok(snippets.length > 0, 'typed browser bridge modules must be packaged');
for (const snippet of snippets) {
  assert.ok(loader.includes(snippet+'?v='+revision), 'loader must pin '+snippet);
}

// Cache-busting must not rename the module keys consumed by WebAssembly.
const wasm = new WebAssembly.Module(await readFile(join(root, 'nelinka_bg.wasm')));
for (const name of new Set(WebAssembly.Module.imports(wasm).map(entry => entry.module))) {
  assert.ok(loader.includes(JSON.stringify(name)+':'), 'loader must preserve WASM import key '+name);
}
