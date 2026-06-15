// Client-only Monaco wiring for the AST explorer. Reached only through a dynamic
// import inside a browser effect, never during SSR, so the ?worker imports and
// `self` are safe here. (Parallel to src/lib/typeprobe/monaco-setup.ts.)
import type * as Monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

export function setupMonacoEnvironment(): void {
  self.MonacoEnvironment = {
    getWorker(_workerId, label) {
      if (label === 'typescript' || label === 'javascript') return new tsWorker();
      return new editorWorker();
    },
  };
}

// Backgrounds matched to the site so the editor doesn't sit on a foreign color.
export function defineThemes(monaco: typeof Monaco): void {
  monaco.editor.defineTheme('explorer-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#0e0e10' },
  });
  monaco.editor.defineTheme('explorer-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#fafafa' },
  });
}

export function themeName(dark: boolean): string {
  return dark ? 'explorer-dark' : 'explorer-light';
}

// This is a transform playground, not a type-checker. Monaco's TS/JS language
// service otherwise flags every bare or `node:` import as "cannot find module"
// (ts 2792) with red squiggles, which is just noise here. Turn off semantic
// validation for both languages and let imports resolve to nothing.
export function configureLanguages(monaco: typeof Monaco): void {
  const ts = monaco.typescript;
  for (const defaults of [ts.typescriptDefaults, ts.javascriptDefaults]) {
    defaults.setCompilerOptions({
      target: ts.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      noResolve: true,
    });
    defaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
  }
}
