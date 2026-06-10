import { mountEditorDemo } from '../../src/demo-editor.mjs';

const editor = await mountEditorDemo(document, {
  fontUrls: {
    EBGaramond: '/fonts/EBGaramond-subset.ttf',
    Inter: '/fonts/Inter-subset.ttf',
    FiraCode: '/fonts/FiraCode-subset.ttf',
  },
});
editor.focus();
