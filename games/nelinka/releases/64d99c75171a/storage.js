// Miniquad's explicitly registered bridge. No network or server-side storage.
const levelKey = 'nelinka-workshop-level-v2';
const encoder = new TextEncoder(), decoder = new TextDecoder();
miniquad_add_plugin({
  name: 'nelinka_storage', version: 1,
  register_plugin(imports) {
    const player = window.nelinkaCampaign;
    imports.env.nelinka_player_mode = () => player ? 1 : 0;
    imports.env.nelinka_player_action = () => player?.actions.shift() || 0;
    imports.env.nelinka_player_input = () => (player?.bits || 0) | (player?.latched || 0);
    imports.env.nelinka_player_consumed = () => { if (player) player.latched = 0; };
    imports.env.nelinka_player_load = (pointer, capacity) => {
      try {
        const bytes = encoder.encode(localStorage.getItem('nelinka-campaign-v1') || '');
        if (bytes.length > capacity) return -1;
        new Uint8Array(wasm_memory.buffer, pointer, capacity).set(bytes);
        return bytes.length;
      } catch { return -1; }
    };
    imports.env.nelinka_player_save = (pointer, length) => {
      try { localStorage.setItem('nelinka-campaign-v1', decoder.decode(new Uint8Array(wasm_memory.buffer, pointer, length))); }
      catch { player?.storageError(); }
    };
    imports.env.nelinka_player_publish = (pointer, length) => {
      player?.update(JSON.parse(decoder.decode(new Uint8Array(wasm_memory.buffer, pointer, length))));
    };
    let frame = 0;
    imports.env.nelinka_frame = () => { document.querySelector('#glcanvas').dataset.frame = String(++frame); };
    imports.env.nelinka_ready = () => { document.querySelector('#glcanvas').dataset.ready = 'true'; };
    imports.env.nelinka_save = (pointer, length) => {
      try {
        localStorage.setItem(levelKey, decoder.decode(new Uint8Array(wasm_memory.buffer, pointer, length)));
        return 1;
      } catch { return 0; }
    };
    imports.env.nelinka_load = (pointer, capacity) => {
      try {
        const text = localStorage.getItem(levelKey);
        if (!text) return -1;
        const bytes = encoder.encode(text);
        if (bytes.length > capacity) return -1;
        new Uint8Array(wasm_memory.buffer, pointer, capacity).set(bytes);
        return bytes.length;
      } catch { return -1; }
    };
  }
});
function notice(text) {
  const output = document.querySelector('#notice');
  output.textContent = text; output.style.display = 'block';
  setTimeout(() => output.style.display = 'none', 6000);
}
if (document.querySelector('#export')) document.querySelector('#export').onclick = () => {
  try {
    const text = localStorage.getItem(levelKey);
    if (!text) return notice('Use Save in the editor before exporting.');
    const url = URL.createObjectURL(new Blob([text], {type:'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'nelinka-level.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { notice('Browser storage is unavailable.'); }
};
if (document.querySelector('#file')) document.querySelector('#file').onchange = async (event) => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 4000000) throw new Error('Level exceeds 4 MB.');
    const text = await file.text(); JSON.parse(text);
    // The Rust loader performs schema, geometry and version validation.
    localStorage.setItem(levelKey, text);
    notice('Imported file. Press Load in the editor to validate and open it; Undo restores previous edits.');
    document.querySelector('#glcanvas').focus();
  } catch (error) { notice(error.message); }
  event.target.value = '';
};
// The application owns these shortcuts while its canvas has focus.
document.querySelector('#glcanvas').addEventListener('keydown', event => {
  if (['Tab','F3','F5','F6','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)
      || ((event.ctrlKey || event.metaKey) && ['KeyS','KeyO','KeyD','KeyZ','KeyY'].includes(event.code))) event.preventDefault();
});
