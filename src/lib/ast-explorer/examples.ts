// A ~320 KB generated module (see scripts/gen-big-sample.mjs). Small snippets
// parse in microseconds, below the browser clock's resolution, so the timing
// race is only meaningful on an input this size.
import bigSample from './big-sample.js?raw';

export interface Example {
  id: string;
  label: string;
  lang: 'javascript' | 'typescript';
  code: string;
}

export const examples: Example[] = [
  {
    id: 'esm',
    label: 'ESM imports (the race)',
    lang: 'javascript',
    code: `import { html, render } from 'lit-html';
import confetti from 'canvas-confetti';
import { add } from './math.js';
import process from 'node:process';

export { add } from './math.js';
export * from 'nanoid';

render(html\`<h1>\${add(1, 2)}</h1>\`, document.body);
confetti();
`,
  },
  {
    id: 'large',
    label: 'Large module (~320 KB, for the timing race)',
    lang: 'javascript',
    code: bigSample,
  },
  {
    id: 'typescript',
    label: "TypeScript (both strip the types)",
    lang: 'typescript',
    code: `import type { Plugin } from 'rollup';
import { resolve } from 'node:path';

interface Options {
  prefix: string;
  exts?: readonly string[];
}

export function patchImports(opts: Options): Plugin {
  const exts = opts.exts ?? ['.js', '.ts'];
  return {
    name: 'patch-imports',
    resolveId(id: string): string | null {
      return exts.some((e) => id.endsWith(e)) ? resolve(id) : null;
    },
  };
}
`,
  },
];
