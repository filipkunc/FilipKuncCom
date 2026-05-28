// Client-only Monaco wiring. This module is reached only through a dynamic
// import inside a browser effect, never during SSR, so the ?worker imports
// and the `self` reference are safe here.
import type * as Monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

// Monaco runs its language services in web workers and asks for one by
// language label. The TypeScript worker is the one that produces the
// diagnostics we map onto the JSON pane.
export function setupMonacoEnvironment(): void {
  self.MonacoEnvironment = {
    getWorker(_workerId, label) {
      if (label === 'typescript' || label === 'javascript') return new tsWorker();
      if (label === 'json') return new jsonWorker();
      return new editorWorker();
    },
  };
}

// Two themes whose background matches the site so the editors do not sit on a
// foreign color. Token colors are inherited from Monaco's built-in themes.
export function defineThemes(monaco: typeof Monaco): void {
  monaco.editor.defineTheme('typeprobe-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#0e0e10' },
  });
  monaco.editor.defineTheme('typeprobe-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#fafafa' },
  });
}

// Turn on full TypeScript validation (this is what flags structural and
// excess-property problems), and turn OFF Monaco's own JSON validation, since
// the JSON pane is validated by the TypeScript compiler instead.
export function configureLanguages(monaco: typeof Monaco): void {
  const ts = monaco.typescript;
  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ES2020,
    strict: true,
    noImplicitAny: true,
    allowNonTsExtensions: true,
  });
  ts.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
  monaco.json.jsonDefaults.setDiagnosticsOptions({ validate: false, schemas: [] });
}

// The hidden TypeScript file that the compiler actually checks. The JSON the
// reader edits is dropped in on its own lines so that a diagnostic on TS line N
// maps to JSON line N-1 with the column unchanged.
const DATA_HEADER = 'const data: Root =';

export function buildDataSource(jsonText: string): string {
  return `${DATA_HEADER}\n${jsonText.replace(/\s+$/, '')}\n;\n`;
}

// TS line 1 is the `const data: Root =` header; the JSON starts on TS line 2.
export const JSON_LINE_OFFSET = 1;
