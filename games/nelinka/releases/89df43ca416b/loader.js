// Keep download progress separate from renderer/audio setup: percentages only
// describe bytes, never an invented estimate of compilation or GPU work.
const $ = id => document.getElementById(id);
const cs = document.documentElement.lang === 'cs';
const say = (czech, english) => cs ? czech : english;
const asset = name => new URL(name + new URL(import.meta.url).search, import.meta.url);
let finished = false;
let timeout;
const observer = new MutationObserver(() => {
  if (Number($('glcanvas').dataset.frame) > 0) {
    finished = true;
    clearTimeout(timeout);
    observer.disconnect();
    $('loading').hidden = true;
    document.body.classList.remove('loading');
    if (window.nelinkaCampaign && !$('overlay').hidden) $('continue').focus({preventScroll:true});
    else $('glcanvas').focus();
  }
});
observer.observe($('glcanvas'), {attributes:true, attributeFilter:['data-frame']});
function fail(error) {
  if (finished) return;
  clearTimeout(timeout);
  observer.disconnect();
  document.body.dataset.error = String(error);
  $('loading-label').textContent = say('Načítání se nezdařilo', 'Loading failed');
  $('loading-detail').textContent = say('Zkontroluj připojení a zkus to znovu. Pokud problém trvá, aktualizuj prohlížeč.', 'Check your connection and try again. If the problem persists, update your browser.');
  $('loading-progress').hidden = true;
  $('loading-retry').hidden = false;
}
$('loading-retry').onclick = () => location.reload();
window.addEventListener('error', event => fail(event.error || event.message));
window.addEventListener('unhandledrejection', event => fail(event.reason));
// A slow connection remains allowed; this message does not abort its download.
timeout = setTimeout(() => {
  $('loading-detail').textContent = say('Stále načítám. Na pomalém připojení to může trvat déle.', 'Still loading. A slow connection may need more time.');
  $('loading-retry').hidden = false;
}, 60000);
async function download() {
  let compressed = typeof DecompressionStream === 'function';
  let response = await fetch(asset(compressed ? 'nelinka_bg.wasm.gz' : 'nelinka_bg.wasm'));
  if (!response.ok && compressed) {
    compressed = false;
    response = await fetch(asset('nelinka_bg.wasm'));
  }
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  // Content-Encoding is decoded by fetch itself; its length describes wire
  // bytes, so do not compare it with the decoded stream. The payload may
  // still be gzip if the host applied another compression layer to the file.
  const encoded = !!response.headers.get('Content-Encoding');
  const total = encoded ? 0 : Number(response.headers.get('Content-Length'));
  let loaded = 0;
  const progress = $('loading-progress');
  const stream = response.body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      loaded += chunk.byteLength;
      if (total > 0) { progress.max = total; progress.value = Math.min(loaded, total); }
      $('loading-label').textContent = say('Stahuji hru…', 'Downloading the game…');
      $('loading-detail').textContent = `${(loaded / 1048576).toFixed(1)} MB${total > 0 ? ` / ${(total / 1048576).toFixed(1)} MB · ${Math.min(100, Math.floor(loaded / total * 100))}%` : ''}`;
      controller.enqueue(chunk);
    },
    flush() {
      progress.removeAttribute('value');
      $('loading-label').textContent = say('Připravuji les…', 'Preparing the workshop…');
      $('loading-detail').textContent = say('Spouštím grafiku a zvuky.', 'Starting graphics and sounds.');
    }
  }));
  return new Response(compressed ? await decompressPayload(stream) : stream, {headers:{'Content-Type':'application/wasm'}});
}
async function decompressPayload(stream) {
  const reader = stream.getReader();
  const prefix = [];
  let size = 0;
  while (size < 2) {
    const {value, done} = await reader.read();
    if (done) break;
    prefix.push(value);
    size += value.length;
  }
  const firstBytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of prefix) { firstBytes.set(chunk, offset); offset += chunk.length; }
  const payload = new ReadableStream({
    start(controller) { controller.enqueue(firstBytes); },
    async pull(controller) {
      const {value, done} = await reader.read();
      if (done) controller.close(); else controller.enqueue(value);
    },
    cancel(reason) { return reader.cancel(reason); }
  });
  // Fetch already removed HTTP Content-Encoding. Inspect the remaining bytes:
  // hosts can serve either raw gzip, HTTP-decoded WASM, or gzip wrapped in br/gzip.
  return firstBytes[0] === 0x1f && firstBytes[1] === 0x8b
    ? payload.pipeThrough(new DecompressionStream('gzip')) : payload;
}
try {
  // Compile while the download arrives, without keeping a second WASM copy.
  const [module, response] = await Promise.all([import(asset('nelinka.js')), download()]);
  await module.default({module_or_path:response});
} catch (error) { console.error(error); fail(error); }
