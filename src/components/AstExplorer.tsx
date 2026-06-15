import { useRef, useEffect, useState, useCallback } from 'react';
import type * as Monaco from 'monaco-editor';
import 'monaco-editor/min/vs/editor/editor.main.css';
import { examples, type Example } from '../lib/ast-explorer/examples';
import * as oxc from '../lib/ast-explorer/oxc-engine';
import * as acorn from '../lib/ast-explorer/acorn-engine';
import AstTree from './AstTree';
import SourceMapViz from './SourceMapViz';

// An astexplorer-style playground for one idea: patching ESM imports. The same
// custom transform — rewrite bare import specifiers — runs two ways on whatever
// you type: oxc compiled to wasm (Rust), and Acorn + astring (JS). You see the
// AST, the rewritten output, and how long each engine took. oxc additionally
// strips TypeScript types, which Acorn can't parse at all.

type View = 'ast' | 'output' | 'map';
type EngineId = 'oxc' | 'acorn';

// Browsers coarsen performance.now() to ~100 µs, so a single small parse times
// as 0. Instead run the call repeatedly for a fixed budget and divide total by
// the iteration count — that recovers sub-resolution per-call numbers. Each
// iteration is the full round trip (for oxc, including the wasm memory copy),
// i.e. the real cost of asking the engine to do the work from JS.
function amortized(fn: () => void): number {
  for (let i = 0; i < 3; i++) fn(); // warm
  let iters = 0;
  const t0 = performance.now();
  let elapsed = 0;
  do {
    fn();
    iters++;
    elapsed = performance.now() - t0;
  } while (elapsed < 25 && iters < 200000);
  return elapsed / iters;
}

export default function AstExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const outContainerRef = useRef<HTMLDivElement>(null);
  const outEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(true);
  const [exampleId, setExampleId] = useState<string>(examples[0].id);
  const [engine, setEngine] = useState<EngineId>('oxc');
  const [view, setView] = useState<View>('output');
  const [prefix, setPrefix] = useState('https://esm.sh/');

  const [source, setSource] = useState(examples[0].code);
  const [ast, setAst] = useState('');
  const [output, setOutput] = useState('');
  const [map, setMap] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Milliseconds for the transform (parse + rewrite + codegen) — the ESM-patching
  // job itself, and the apples-to-apples comparison between the two engines.
  const [oxcMs, setOxcMs] = useState<number | null>(null);
  const [acornMs, setAcornMs] = useState<number | null>(null);

  const example: Example = examples.find((e) => e.id === exampleId) ?? examples[0];
  const isTs = example.lang === 'typescript';
  const activeEngine: EngineId = engine;

  // Follow the site theme (html[data-theme], set by the header toggle).
  useEffect(() => {
    const resolve = () => setDark(document.documentElement.dataset.theme !== 'light');
    resolve();
    const obs = new MutationObserver(resolve);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Mount Monaco once, client-side only: an editable source editor and a
  // read-only output editor (so the generated code is syntax-highlighted too).
  useEffect(() => {
    let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
    let outEditor: Monaco.editor.IStandaloneCodeEditor | null = null;
    let disposed = false;
    (async () => {
      const monaco = await import('monaco-editor');
      const { setupMonacoEnvironment, defineThemes, themeName, configureLanguages } = await import(
        '../lib/ast-explorer/monaco-setup'
      );
      if (disposed) return;
      setupMonacoEnvironment();
      defineThemes(monaco);
      configureLanguages(monaco);
      monacoRef.current = monaco;
      const theme = themeName(document.documentElement.dataset.theme !== 'light');
      const common = {
        theme,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
      } as const;
      editor = monaco.editor.create(containerRef.current!, {
        value: examples[0].code,
        language: examples[0].lang,
        ...common,
      });
      outEditor = monaco.editor.create(outContainerRef.current!, {
        value: '',
        language: 'javascript',
        readOnly: true,
        ...common,
      });
      editorRef.current = editor;
      outEditorRef.current = outEditor;
      editor.onDidChangeModelContent(() => setSource(editor!.getValue()));
      // Wait for the wasm before declaring ready: the synchronous oxc calls (and
      // the timing loop) need the module instantiated.
      await oxc.warmup();
      if (!disposed) setReady(true);
    })();
    return () => {
      disposed = true;
      editor?.dispose();
      outEditor?.dispose();
    };
  }, []);

  // Keep Monaco's theme in sync.
  useEffect(() => {
    monacoRef.current?.editor.setTheme(dark ? 'explorer-dark' : 'explorer-light');
  }, [dark]);

  // Switch the editor's content + language when the example changes.
  const loadExample = useCallback((id: string) => {
    const ex = examples.find((e) => e.id === id);
    if (!ex || !editorRef.current || !monacoRef.current) return;
    setExampleId(id);
    const model = editorRef.current.getModel();
    if (model) monacoRef.current.editor.setModelLanguage(model, ex.lang);
    editorRef.current.setValue(ex.code);
  }, []);

  // Recompute (debounced) whenever the source, prefix, or active engine changes.
  // Everything is synchronous now that the wasm is warm, so this is plain.
  useEffect(() => {
    if (!ready) return;
    const handle = setTimeout(() => {
      // Display result for the selected engine. The transform also emits a source
      // map, so a stack trace in the rewritten output still points at the original.
      const parsed = activeEngine === 'oxc' ? oxc.parseSync(source) : acorn.parse(source, isTs);
      const transformed =
        activeEngine === 'oxc'
          ? oxc.transformMapSync(source, prefix)
          : acorn.transformMap(source, prefix, isTs);
      setAst(parsed.ok ? parsed.text : '');
      setOutput(transformed.ok ? transformed.code : '');
      setMap(transformed.ok ? transformed.map : '');
      setError(!parsed.ok ? parsed.text : !transformed.ok ? transformed.code : null);

      // Timing race on the transform — both engines do the same job (strip types
      // for TS, then rewrite imports), so the comparison is apples-to-apples.
      setOxcMs(amortized(() => oxc.transformSync(source, prefix)));
      setAcornMs(amortized(() => acorn.transform(source, prefix, isTs)));
    }, 150);
    return () => clearTimeout(handle);
  }, [source, prefix, activeEngine, isTs, ready]);

  // Push generated code into the read-only output editor; re-layout when it
  // becomes visible (Monaco can't measure a display:none container).
  useEffect(() => {
    const ed = outEditorRef.current;
    if (!ed || view !== 'output') return;
    if (ed.getValue() !== output) ed.setValue(output);
    requestAnimationFrame(() => ed.layout());
  }, [output, view, error, ready]);

  return (
    <div className="astx">
      <div className="astx-controls">
        <label>
          example
          <select value={exampleId} onChange={(e) => loadExample(e.target.value)}>
            {examples.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </label>
        <label>
          import prefix
          <input
            type="text"
            value={prefix}
            placeholder="(none)"
            onChange={(e) => setPrefix(e.target.value)}
          />
        </label>
        <div className="astx-engine" role="group" aria-label="engine">
          <button
            className={activeEngine === 'oxc' ? 'on' : ''}
            onClick={() => setEngine('oxc')}
          >oxc (wasm)</button>
          <button
            className={activeEngine === 'acorn' ? 'on' : ''}
            title="acorn + acorn-typescript + astring"
            onClick={() => setEngine('acorn')}
          >acorn (js)</button>
        </div>
      </div>

      <div className="astx-panes">
        <div className="astx-pane">
          <div className="astx-pane-head">source · {example.lang}</div>
          <div ref={containerRef} className="astx-editor" />
        </div>
        <div className="astx-pane">
          <div className="astx-pane-head astx-tabs">
            <button className={view === 'output' ? 'on' : ''} onClick={() => setView('output')}>output</button>
            <button className={view === 'ast' ? 'on' : ''} onClick={() => setView('ast')}>AST</button>
            <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>source map</button>
            <span className="astx-engine-tag">{activeEngine}</span>
          </div>
          {/* The output editor stays mounted (Monaco binds to its node); other
              views and the error/loading states render over it. */}
          <div
            ref={outContainerRef}
            className="astx-editor"
            style={{ display: !error && ready && view === 'output' ? 'block' : 'none' }}
          />
          {!ready && <div className="astx-out">loading wasm…</div>}
          {ready && error && <div className="astx-out astx-err">{error}</div>}
          {ready && !error && view === 'ast' && <AstTree json={ast} />}
          {ready && !error && view === 'map' && (
            <SourceMapViz source={source} code={output} mapJson={map} />
          )}
        </div>
      </div>

      <div className="astx-race">
        <table>
          <thead>
            <tr><th>engine</th><th className="num">transform</th><th></th></tr>
          </thead>
          <tbody>
            <tr>
              <td>oxc (wasm)</td>
              <td className="num">{oxcMs != null ? `${fmt(oxcMs)} ms` : '—'}</td>
              <td className="win">{oxcMs != null && acornMs != null ? speedup(acornMs, oxcMs) : ''}</td>
            </tr>
            <tr>
              <td>acorn + astring (js)</td>
              <td className="num">{acornMs != null ? `${fmt(acornMs)} ms` : '—'}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <p className="astx-note">
          The transform is parse + rewrite imports + codegen — the whole ESM-patching
          round trip, the same rewrite on both sides (output matches apart from quote
          style and spacing). Each number is the per-call cost averaged over a fixed time
          budget (sub-millisecond parses can't be timed directly in a browser, which is
          why the <strong>large module</strong> example is where the gap is honest).
        </p>
      </div>

      <style>{`
        .astx { margin: 1.5rem 0; font-size: 0.9rem; }
        .astx-controls {
          display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .astx-controls label {
          display: flex; flex-direction: column; gap: 0.25rem;
          font-size: 0.78rem; color: var(--muted);
        }
        .astx-controls select, .astx-controls input {
          font: inherit; font-size: 0.85rem; padding: 0.3rem 0.45rem;
          background: var(--bg); color: var(--fg);
          border: 1px solid var(--rule); border-radius: 6px;
        }
        .astx-controls input { min-width: 13rem; font-family: 'JetBrains Mono', monospace; }
        .astx-engine { display: flex; }
        .astx-engine button {
          font: inherit; font-size: 0.82rem; padding: 0.35rem 0.7rem;
          background: var(--bg); color: var(--muted);
          border: 1px solid var(--rule); cursor: pointer;
        }
        .astx-engine button:first-child { border-radius: 6px 0 0 6px; }
        .astx-engine button:last-child { border-radius: 0 6px 6px 0; border-left: none; }
        .astx-engine button.on { color: var(--fg); background: var(--code-bg, rgba(127,127,127,0.12)); font-weight: 600; }
        .astx-engine button:disabled { opacity: 0.4; cursor: not-allowed; }
        .astx-panes {
          display: grid; grid-template-columns: 1fr; gap: 0.75rem;
        }
        .astx-pane {
          border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .astx-pane-head {
          font-size: 0.75rem; color: var(--muted); padding: 0.4rem 0.6rem;
          border-bottom: 1px solid var(--rule); display: flex; gap: 0.5rem; align-items: center;
        }
        .astx-tabs button {
          font: inherit; font-size: 0.75rem; background: none; border: none;
          color: var(--muted); cursor: pointer; padding: 0.1rem 0.3rem;
        }
        .astx-tabs button.on { color: var(--fg); font-weight: 600; }
        .astx-engine-tag { margin-left: auto; font-family: 'JetBrains Mono', monospace; opacity: 0.7; }
        .astx-editor { height: 300px; }
        .astx-out {
          margin: 0; height: 300px; overflow: auto; padding: 0.6rem 0.75rem;
          font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; line-height: 1.5;
          white-space: pre; tab-size: 2; background: var(--bg);
        }
        .astx-err { color: var(--accent); }
        /* Inherit the site's global table style (padding, borders, header); only
           add right-aligned monospace numbers and the green speedup, like the
           other benchmark tables on the site. */
        .astx-race { margin: 1.75rem 0; overflow-x: auto; }
        .astx-race table { width: 100%; max-width: 34rem; }
        .astx-race td.num, .astx-race th.num {
          text-align: right; font-variant-numeric: tabular-nums;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }
        .astx-race td.win { color: #2da44e; font-weight: 600; }
        .astx-note { color: var(--muted); font-size: 0.78rem; margin-top: 0.5rem; }
      `}</style>
    </div>
  );
}

// Sub-millisecond numbers need more digits to be readable; larger ones don't.
function fmt(ms: number): string {
  return ms < 1 ? ms.toFixed(3) : ms.toFixed(1);
}

function speedup(slow: number, fast: number): string {
  const ratio = slow / fast;
  return ratio >= 1 ? `${ratio.toFixed(1)}× faster` : '';
}
