// Browser file import/export. Storage and campaign messages use the typed Rust bridge.
const levelKey = 'nelinka-workshop-level-v2';
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
      || ((event.ctrlKey || event.metaKey) && ['KeyA','KeyS','KeyO','KeyD','KeyZ','KeyY'].includes(event.code))) event.preventDefault();
});
