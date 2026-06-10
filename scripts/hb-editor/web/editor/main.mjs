import { mountEditorDemo } from '../../src/demo-editor.mjs';

const editor = await mountEditorDemo(document, {
  fontUrls: {
    EBGaramond: '/fonts/EBGaramond.ttf',
    Inter: '/fonts/Inter.ttf',
    FiraCode: '/fonts/FiraCode.ttf',
  },
});
editor.focus();
