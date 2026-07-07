const { analyze } = require('./index');

// 1. TypeScript parses natively (note the filename drives language detection).
const ts = analyze(
  `interface Point { x: number; y: number }
   const origin: Point = { x: 0, y: 0 };
   export function len(p: Point): number { return Math.hypot(p.x, p.y); }`,
  'point.ts',
);
console.log('--- point.ts ---');
console.log('source type:', ts.sourceType);
console.log('statements:', ts.statementCount, 'errors:', ts.errorCount);
console.log('printed back by oxc_codegen:');
console.log(ts.code);

// 2. Broken JS: oxc recovers and reports diagnostics with spans.
const broken = analyze('const x = ;\nfunction f( { return 1; }', 'broken.js');
console.log('--- broken.js ---');
for (const err of broken.errors) {
  console.log(`  offset ${err.offset}: ${err.message}`);
}

// 3. Round-trip: formatting is normalized (comments survive in recent oxc_codegen).
const js = analyze('// a comment\nlet   a=1;;;\nconsole.log( a )', 'tidy.js');
console.log('--- tidy.js ---');
console.log(js.code);
