// #region node-test
// The JS layer tested through the real addon (build/addon.node must exist:
// npm run build first). node:test, so `npm test` needs no dependencies and
// the nodejs-testing extension shows these next to the C++ and Rust tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyze } = require('../index');

test('detects TypeScript from the filename', () => {
  const report = analyze('const x: number = 1;', 'x.ts');
  assert.equal(report.sourceType.typescript, true);
  assert.equal(report.errorCount, 0);
});

test('reports syntax errors with offsets', () => {
  const report = analyze('const x = ;', 'x.js');
  assert.equal(report.errorCount, 1);
  assert.equal(report.errors[0].offset, 10);
});

test('round-trips code through oxc_codegen', () => {
  const report = analyze('let   a=1\nconsole.log( a )', 'tidy.js');
  assert.equal(report.code, 'let a = 1;\nconsole.log(a);\n');
});
// #endregion node-test
