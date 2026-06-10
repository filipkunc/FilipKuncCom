import { mountCompareDemo } from '../../src/demo-compare.mjs';

await mountCompareDemo(document, {
  fontUrls: {
    Inter: '/fonts/Inter-subset.ttf',
    EBGaramond: '/fonts/EBGaramond-subset.ttf',
    FiraCode: '/fonts/FiraCode-subset.ttf',
  },
});
