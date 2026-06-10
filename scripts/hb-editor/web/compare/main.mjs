import { mountCompareDemo } from '../../src/demo-compare.mjs';

await mountCompareDemo(document, {
  fontUrls: {
    Inter: '/fonts/Inter.ttf',
    EBGaramond: '/fonts/EBGaramond.ttf',
    FiraCode: '/fonts/FiraCode.ttf',
  },
});
