// Deterministic ~120KB valid ESM module: a few import edges at the top (so the
// rewrite has work to do) + many unique functions (so parse/codegen is real).
let out = `import { readFile } from 'node:fs/promises';
import { debounce } from 'lodash-es';
import confetti from 'canvas-confetti';
import { join } from './paths.js';
export { join } from './paths.js';
export * from 'nanoid';

`;
for (let i = 0; i < 1400; i++) {
  out += `export function handler_${i}(input) {
  const scaled = input.map((x) => x * ${i + 1} + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: ${i % 360} }), ${i % 50});
}

`;
}
process.stdout.write(out);
