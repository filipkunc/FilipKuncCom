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
