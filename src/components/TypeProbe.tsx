import { useRef, useEffect, useState, useCallback } from 'react';
import type * as Monaco from 'monaco-editor';
// Monaco's ESM build scatters its styles across ~140 per-module css imports
// that the production build does not emit on its own. Pulling in the
// aggregated stylesheet here gets it bundled and linked with the island, so
// the editors are styled in the built site, not just in dev. This is a plain
// css side-effect import, so it stays SSR-safe.
import 'monaco-editor/min/vs/editor/editor.main.css';
import { inferType } from '../lib/typeprobe/infer';
import { examples } from '../lib/typeprobe/examples';

// This top-level module is SSR-safe: it imports only React, types, and the
// pure inferrer/examples. Monaco and the validator generator are pulled in
// with dynamic import() inside effects and handlers, never on the server.

type MonacoModule = typeof Monaco;

export default function TypeProbe() {
  const monacoRef = useRef<MonacoModule | null>(null);

  // The type pane (a real TypeScript file).
  const typeContainerRef = useRef<HTMLDivElement>(null);
  const typeEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const typeModelRef = useRef<Monaco.editor.ITextModel | null>(null);

  // The value pane (plain JSON the reader edits).
  const jsonContainerRef = useRef<HTMLDivElement>(null);
  const jsonEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const jsonModelRef = useRef<Monaco.editor.ITextModel | null>(null);

  // A hidden `const data: Root = <json>` file that the compiler checks. Its
  // diagnostics are mapped back onto the JSON pane.
  const dataModelRef = useRef<Monaco.editor.ITextModel | null>(null);

  // The generated-validator pane.
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const outputEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const outputModelRef = useRef<Monaco.editor.ITextModel | null>(null);
  const validateFnRef = useRef<((value: unknown) => boolean) | null>(null);

  const revalidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState(examples[0].id);
  const [errorCount, setErrorCount] = useState(0);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [validatorCode, setValidatorCode] = useState('');
  const [validatorError, setValidatorError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean } | { error: string } | null>(null);

  // Track the OS color scheme, like the rest of the site.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Ask the TypeScript worker to check the hidden data file, then translate its
  // diagnostics into markers on the visible JSON pane. This is what makes the
  // JSON light up with type errors that come from the compiler.
  const revalidate = useCallback(async () => {
    const monaco = monacoRef.current;
    const dataModel = dataModelRef.current;
    const jsonModel = jsonModelRef.current;
    if (!monaco || !dataModel || !jsonModel) return;

    const getWorker = await monaco.typescript.getTypeScriptWorker();
    const client = await getWorker(dataModel.uri);
    const uri = dataModel.uri.toString();
    const diagnostics = [
      ...(await client.getSyntacticDiagnostics(uri)),
      ...(await client.getSemanticDiagnostics(uri)),
    ];

    const flatten = (m: string | { messageText: string; next?: unknown[] }): string =>
      typeof m === 'string' ? m : m.messageText;

    const lineCount = jsonModel.getLineCount();
    let errors = 0;
    const markers = diagnostics
      .filter((d) => typeof d.start === 'number')
      .map((d) => {
        const start = dataModel.getPositionAt(d.start as number);
        const end = dataModel.getPositionAt((d.start as number) + (d.length ?? 0));
        const isError = d.category === 1;
        if (isError) errors += 1;
        return {
          // TS line 1 is the header, so shift JSON up by one line and clamp.
          startLineNumber: Math.min(Math.max(start.lineNumber - 1, 1), lineCount),
          startColumn: start.column,
          endLineNumber: Math.min(Math.max(end.lineNumber - 1, 1), lineCount),
          endColumn: end.column,
          message: flatten(d.messageText as never),
          severity: isError
            ? monaco.MarkerSeverity.Error
            : d.category === 0
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
        };
      });

    monaco.editor.setModelMarkers(jsonModel, 'typeprobe', markers);
    setErrorCount(errors);
  }, []);

  const scheduleRevalidate = useCallback(() => {
    if (revalidateTimer.current) clearTimeout(revalidateTimer.current);
    revalidateTimer.current = setTimeout(() => void revalidate(), 300);
  }, [revalidate]);

  // Mount both editors once, on the client.
  useEffect(() => {
    let disposed = false;
    (async () => {
      const monaco = await import('monaco-editor');
      const setup = await import('../lib/typeprobe/monaco-setup');
      if (disposed || !typeContainerRef.current || !jsonContainerRef.current) return;

      setup.setupMonacoEnvironment();
      setup.defineThemes(monaco);
      setup.configureLanguages(monaco);

      const theme = dark ? 'typeprobe-dark' : 'typeprobe-light';
      const mono = 'JetBrains Mono, Cascadia Code, Fira Code, Consolas, monospace';
      const seed = examples[0].json;
      const seedType = inferType(JSON.parse(seed));

      const typeModel = monaco.editor.createModel(
        seedType,
        'typescript',
        monaco.Uri.parse('file:///root.ts'),
      );
      const jsonModel = monaco.editor.createModel(
        seed,
        'json',
        monaco.Uri.parse('file:///value.json'),
      );
      // No editor is attached to this one. The worker still checks it because
      // it is a registered TypeScript model.
      const dataModel = monaco.editor.createModel(
        setup.buildDataSource(seed),
        'typescript',
        monaco.Uri.parse('file:///data.ts'),
      );

      const common = {
        theme,
        fontSize: 13,
        fontFamily: mono,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        padding: { top: 10, bottom: 10 },
      } as const;

      const typeEditor = monaco.editor.create(typeContainerRef.current, {
        ...common,
        model: typeModel,
      });
      const jsonEditor = monaco.editor.create(jsonContainerRef.current, {
        ...common,
        model: jsonModel,
        renderLineHighlight: 'none',
      });

      // Size the type pane to its content (it is usually short).
      const fitType = () => {
        if (!typeContainerRef.current) return;
        const h = Math.min(Math.max(typeEditor.getContentHeight(), 90), 280);
        typeContainerRef.current.style.height = `${h}px`;
        typeEditor.layout();
      };
      typeEditor.onDidContentSizeChange(fitType);
      fitType();

      // Editing the JSON updates the hidden file; editing either pane triggers
      // a recheck.
      jsonModel.onDidChangeContent(() => {
        dataModel.setValue(setup.buildDataSource(jsonModel.getValue()));
        scheduleRevalidate();
      });
      typeModel.onDidChangeContent(() => scheduleRevalidate());

      monacoRef.current = monaco;
      typeModelRef.current = typeModel;
      typeEditorRef.current = typeEditor;
      jsonModelRef.current = jsonModel;
      jsonEditorRef.current = jsonEditor;
      dataModelRef.current = dataModel;
      setReady(true);
      scheduleRevalidate();

      // Dev-only hook for headless tests. Stripped from production builds.
      if (import.meta.env.DEV) {
        (window as unknown as { __typeprobe?: unknown }).__typeprobe = {
          monaco,
          typeModel,
          jsonModel,
          dataModel,
        };
      }
    })();

    return () => {
      disposed = true;
      if (revalidateTimer.current) clearTimeout(revalidateTimer.current);
      typeEditorRef.current?.dispose();
      jsonEditorRef.current?.dispose();
      outputEditorRef.current?.dispose();
      typeModelRef.current?.dispose();
      jsonModelRef.current?.dispose();
      dataModelRef.current?.dispose();
      outputModelRef.current?.dispose();
    };
    // Mount once. Theme changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live theme switch without rebuilding the editors (theme is global).
  useEffect(() => {
    monacoRef.current?.editor.setTheme(dark ? 'typeprobe-dark' : 'typeprobe-light');
  }, [dark]);

  // Show the generated validator in a read-only Monaco editor. It references
  // `Root` from the type model, which the shared language service resolves
  // across files, so it shows no spurious errors.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!validatorCode) {
      outputEditorRef.current?.dispose();
      outputModelRef.current?.dispose();
      outputEditorRef.current = null;
      outputModelRef.current = null;
      return;
    }
    if (!monaco || !outputContainerRef.current) return;

    if (!outputEditorRef.current) {
      const model = monaco.editor.createModel(
        validatorCode,
        'typescript',
        monaco.Uri.parse('file:///validator.ts'),
      );
      const editor = monaco.editor.create(outputContainerRef.current, {
        model,
        readOnly: true,
        domReadOnly: true,
        theme: dark ? 'typeprobe-dark' : 'typeprobe-light',
        fontSize: 13,
        fontFamily: 'JetBrains Mono, Cascadia Code, Fira Code, Consolas, monospace',
        minimap: { enabled: false },
        lineNumbers: 'off',
        folding: false,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'none',
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
      });
      const fit = () => {
        if (!outputContainerRef.current) return;
        const height = Math.min(Math.max(editor.getContentHeight(), 80), 640);
        outputContainerRef.current.style.height = `${height}px`;
        editor.layout();
      };
      editor.onDidContentSizeChange(fit);
      fit();
      outputModelRef.current = model;
      outputEditorRef.current = editor;
    } else {
      outputModelRef.current?.setValue(validatorCode);
    }
  }, [validatorCode, dark]);

  const clearOutput = () => {
    setValidatorCode('');
    setValidatorError(null);
    setTestResult(null);
    validateFnRef.current = null;
  };

  // Load a sample: infer a fresh type and drop the JSON into the value pane.
  const onSelectExample = (id: string) => {
    setSelectedId(id);
    const example = examples.find((e) => e.id === id);
    if (!example) return;
    setJsonError(null);
    clearOutput();
    typeModelRef.current?.setValue(inferType(JSON.parse(example.json)));
    jsonModelRef.current?.setValue(example.json);
  };

  // Re-infer the type from whatever JSON is in the value pane right now.
  const onInferType = () => {
    const jsonModel = jsonModelRef.current;
    const typeModel = typeModelRef.current;
    if (!jsonModel || !typeModel) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonModel.getValue());
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : String(err));
      return;
    }
    setJsonError(null);
    clearOutput();
    typeModel.setValue(inferType(parsed));
  };

  const onGenerate = async () => {
    const typeModel = typeModelRef.current;
    if (!typeModel) return;
    setGenerating(true);
    setValidatorError(null);
    setValidatorCode('');
    setTestResult(null);
    validateFnRef.current = null;
    setCopied(false);
    try {
      const { generateValidator } = await import('../lib/typeprobe/generate-validator');
      const result = await generateValidator(typeModel.getValue());
      if (result.error) {
        setValidatorError(result.error);
        return;
      }
      validateFnRef.current = result.validate ?? null;
      setValidatorCode(result.code);
      runTest();
    } finally {
      setGenerating(false);
    }
  };

  // Parse the value pane as JSON and run the generated validator on it.
  const runTest = useCallback(() => {
    const fn = validateFnRef.current;
    const jsonModel = jsonModelRef.current;
    if (!fn || !jsonModel) return;
    let value: unknown;
    try {
      value = JSON.parse(jsonModel.getValue());
    } catch (err) {
      setTestResult({ error: `The value is not valid JSON: ${err instanceof Error ? err.message : String(err)}` });
      return;
    }
    try {
      setTestResult({ ok: fn(value) === true });
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  const onCopy = async () => {
    if (!validatorCode) return;
    await navigator.clipboard.writeText(validatorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="tp">
      <div className="tp-controls">
        <label className="tp-field">
          <span>Load a sample</span>
          <select value={selectedId} onChange={(e) => onSelectExample(e.target.value)}>
            {examples.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tp-pane-label">
        <code>type Root</code> — edit it to tighten the shape
      </div>
      <div className="tp-type-editor" ref={typeContainerRef}>
        {!ready && <div className="tp-loading">Loading editor…</div>}
      </div>

      <div className="tp-pane-head">
        <span>
          The value, as plain JSON. The TypeScript compiler checks it against <code>Root</code> as
          you type.
        </span>
        <span className="tp-pane-actions">
          {ready &&
            (errorCount === 0 ? (
              <span className="tp-badge-ok">matches Root</span>
            ) : (
              <span className="tp-badge-bad">
                {errorCount} {errorCount === 1 ? 'error' : 'errors'}
              </span>
            ))}
          <button type="button" onClick={onInferType} disabled={!ready}>
            Infer type from value
          </button>
        </span>
      </div>
      <div className="tp-json-editor" ref={jsonContainerRef} />
      {jsonError && <p className="tp-error">Invalid JSON: {jsonError}</p>}

      <div className="tp-actions">
        <button type="button" onClick={() => void onGenerate()} disabled={!ready || generating}>
          {generating ? 'Analyzing types…' : 'Generate validator from this type'}
        </button>
      </div>

      {validatorError && <p className="tp-error tp-output">{validatorError}</p>}

      {validatorCode && (
        <div className="tp-output">
          <div className="tp-output-head">
            <span>Generated by walking the resolved type with the compiler</span>
            <button type="button" className="tp-copy" onClick={() => void onCopy()}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="tp-output-editor" ref={outputContainerRef} />
          <div className="tp-test">
            <button type="button" onClick={() => runTest()}>
              Run it against the value above
            </button>
            {testResult &&
              ('error' in testResult ? (
                <span className="tp-error">{testResult.error}</span>
              ) : testResult.ok ? (
                <span className="tp-pass">
                  <code>validate(data)</code> returned <code>true</code>. The value above matches the
                  type.
                </span>
              ) : (
                <span className="tp-fail">
                  <code>validate(data)</code> returned <code>false</code>. The value above does not
                  match the type.
                </span>
              ))}
          </div>
        </div>
      )}

      <style>{`
        .tp { margin: 1.5rem 0; }
        .tp-controls { display: flex; gap: 1rem; align-items: end; margin-bottom: 0.85rem; }
        .tp-field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: var(--muted); }
        .tp select, .tp button {
          font: inherit; color: var(--fg); background: color-mix(in srgb, var(--fg) 5%, transparent);
          border: 1px solid var(--rule); border-radius: 6px; padding: 0.4rem 0.6rem;
        }
        .tp select { color-scheme: light dark; }
        .tp select option { background: var(--bg); color: var(--fg); }
        .tp button { cursor: pointer; }
        .tp button:hover:not(:disabled) { border-color: var(--accent); }
        .tp button:disabled { opacity: 0.5; cursor: default; }
        .tp-pane-label { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.4rem; }
        .tp-pane-head {
          display: flex; justify-content: space-between; align-items: center; gap: 1rem;
          font-size: 0.85rem; color: var(--muted); margin: 1rem 0 0.4rem;
        }
        .tp-pane-actions { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
        .tp-pane-actions button { padding: 0.25rem 0.55rem; font-size: 0.8rem; }
        .tp-pane-label code, .tp-pane-head code { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
        .tp-badge-ok, .tp-badge-bad {
          font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; white-space: nowrap;
        }
        .tp-badge-ok { color: #2da44e; border: 1px solid color-mix(in srgb, #2da44e 50%, transparent); }
        .tp-badge-bad { color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent); }
        .tp-type-editor {
          position: relative; height: 120px; border: 1px solid var(--rule);
          border-radius: 8px; overflow: hidden;
        }
        .tp-json-editor {
          height: 340px; border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
        }
        .tp-loading {
          position: absolute; inset: 0; display: grid; place-items: center;
          color: var(--muted); font-size: 0.9rem;
        }
        .tp-actions { margin-top: 0.85rem; }
        .tp-output { margin-top: 1rem; }
        .tp-output-head {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.8rem; color: var(--muted); margin-bottom: 0.4rem;
        }
        .tp-copy { padding: 0.2rem 0.55rem !important; font-size: 0.8rem; }
        .tp-output-editor {
          height: 80px; border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
        }
        .tp-test { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.6rem; flex-wrap: wrap; }
        .tp-test span { font-size: 0.85rem; }
        .tp-test code, .tp-pass code, .tp-fail code { font-family: 'JetBrains Mono', monospace; }
        .tp-pass { color: #2da44e; }
        .tp-fail { color: var(--accent); }
        .tp-error { color: var(--accent); font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
