// Client-only Monaco wiring for the agent PR-review diff. Reached only through a
// dynamic import inside a browser effect, never during SSR, so the ?worker
// imports and `self` are safe here. (Parallel to src/lib/ast-explorer/monaco-setup.ts.)
import type * as Monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

export function setupMonacoEnvironment(): void {
  // A read-only diff needs only the core editor worker. No language service, so
  // no TS/JSON worker and no diagnostics chatter.
  self.MonacoEnvironment = {
    getWorker: () => new editorWorker(),
  };
}

// Backgrounds matched to the site card so the editor doesn't sit on a foreign
// color, and the diff tints lean a little greener/redder than the default.
export function defineThemes(monaco: typeof Monaco): void {
  monaco.editor.defineTheme('agent-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0f141b',
      'diffEditor.insertedTextBackground': '#2ea04326',
      'diffEditor.removedTextBackground': '#f8514926',
    },
  });
  monaco.editor.defineTheme('agent-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'diffEditor.insertedTextBackground': '#1a7f3722',
      'diffEditor.removedTextBackground': '#cf222e22',
    },
  });
}

export function themeName(dark: boolean): string {
  return dark ? 'agent-dark' : 'agent-light';
}

// This is a static excerpt, not a project to type-check. Turn the JS language
// service's validation off so no red squiggles appear on the snippet.
export function configureLanguages(monaco: typeof Monaco): void {
  const ts = monaco.languages.typescript;
  ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
}
