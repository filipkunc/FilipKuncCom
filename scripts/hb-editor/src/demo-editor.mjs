// Editor demo, mountable into any root element (standalone page or the post).
// Expects in root: #canvas, #input-proxy, #font (select), #status.
import { loadHb } from './hb.mjs';
import { createEditor } from './editor.mjs';

const DEMO_TEXT =
  'Difficult offices: ffi and fl.\n' +
  'Arrows stop inside ligatures.\n' +
  'Kerning (AV), naïve, copy/paste.';

export async function mountEditorDemo(root, { fontUrls }) {
  const status = root.querySelector('#status');
  const fontPicker = root.querySelector('#font');

  // Fetch the wasm and the initial font in parallel; mobile radio latency
  // makes a sequential waterfall twice as slow.
  const firstName = fontPicker.value;
  const firstBytes = fetch(fontUrls[firstName]).then((r) => r.arrayBuffer());
  const hb = await loadHb();
  const fonts = new Map([[firstName, hb.createFont(new Uint8Array(await firstBytes))]]);
  async function getFont(name) {
    if (!fonts.has(name)) {
      const bytes = new Uint8Array(await (await fetch(fontUrls[name])).arrayBuffer());
      fonts.set(name, hb.createFont(bytes));
    }
    return fonts.get(name);
  }

  const editor = createEditor({
    canvas: root.querySelector('#canvas'),
    textarea: root.querySelector('#input-proxy'),
    hb,
    font: await getFont(fontPicker.value),
    sizePx: 28,
  });
  editor.doc.setText(DEMO_TEXT);
  editor.doc.moveEnd();
  editor.draw();
  status.textContent = `ready (${fontPicker.value})`;

  fontPicker.addEventListener('change', async () => {
    editor.setFont(await getFont(fontPicker.value));
    editor.focus();
    status.textContent = `ready (${fontPicker.value})`;
  });

  window.__ed = editor;
  window.__edReady = true;
  return editor;
}
