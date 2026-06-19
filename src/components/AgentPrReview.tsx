import { useRef, useEffect, useState } from 'react';
import type * as Monaco from 'monaco-editor';
import 'monaco-editor/min/vs/editor/editor.main.css';

// Two real scaffold runs as pull requests against the same starting point: the
// baseline app.js with no summary route. Each PR is the route that run actually
// added, its own confident sign-off, and the checks. Both agents are sure; only
// the hidden judge tells them apart. String.raw keeps the route regexes intact.

// The shared tail (the existing /notes/:id route and the fall-through) is byte
// identical in all three, so the diff shows it as unchanged context and only the
// inserted summary route lights up green.
const TAIL = String.raw`
  // GET /notes/:id -> one note, or 404
  const byId = path.match(/^\/notes\/(\d+)$/);
  if (method === "GET" && byId) {
    const note = store.get(Number(byId[1]));
    if (!note) return send(res, 404, { error: "not found" });
    return send(res, 200, note);
  }

  return send(res, 404, { error: "not found" });`;

const BASE = `  // GET /notes/:id -> one note, or 404
  const byId = path.match(/^\\/notes\\/(\\d+)$/);
  if (method === "GET" && byId) {
    const note = store.get(Number(byId[1]));
    if (!note) return send(res, 404, { error: "not found" });
    return send(res, 200, note);
  }

  return send(res, 404, { error: "not found" });`;

// Without MCP: the agent never saw the ticket, so it copied the file's existing
// bare { error } 404. It cannot know the house error catalog.
const NO_MCP_CODE = String.raw`  // GET /notes/:id/summary -> the note's first sentence, or 404
  const m = path.match(/^\/notes\/(\d+)\/summary$/);
  if (method === "GET" && m) {
    const note = store.get(Number(m[1]));
    if (!note) return send(res, 404, { error: "not found" });
    const summary = summarize(note.body);
    return send(res, 200, { id: note.id, summary });
  }
` + TAIL;

// With skill + MCP: the same model read NOTES-4567 and used the house envelope.
const WITH_MCP_CODE = String.raw`  // GET /notes/:id/summary -> the note's first sentence, or 404
  const m = path.match(/^\/notes\/(\d+)\/summary$/);
  if (method === "GET" && m) {
    const note = store.get(Number(m[1]));
    if (!note) {
      return send(res, 404, {
        error: { code: "NOTE_NOT_FOUND", message: "note not found" },
      });
    }
    const summary = summarize(note.body);
    return send(res, 200, { id: note.id, summary });
  }
` + TAIL;

type Check = { ok: boolean; label: string; detail: string };
type Run = { key: 'nomcp' | 'mcp'; tab: string; model: string; claim: string; code: string; checks: Check[]; verdict: { ok: boolean; text: string } };

// Same model both ways. The only variable is whether it could read the ticket.
const RUNS: Run[] = [
  {
    key: 'nomcp',
    tab: 'Without MCP',
    model: 'claude-sonnet-4-6',
    claim: [
      'Done. GET /notes/:id/summary returns { id, summary }, and',
      '404s with { error } for a missing note. npm run verify passes.',
    ].join('\n'),
    code: NO_MCP_CODE,
    checks: [
      { ok: true, label: 'eslint --no-inline-config', detail: 'no problems' },
      { ok: true, label: 'feature.test.js — the agent wrote these', detail: '2 passing' },
      { ok: false, label: 'acceptance.test.js — the hidden judge', detail: '404 is { error: "not found" }, expected { error: { code: "NOTE_NOT_FOUND", message } }' },
    ],
    verdict: { ok: false, text: 'blocked — it never saw the contract, so it guessed' },
  },
  {
    key: 'mcp',
    tab: 'With MCP',
    model: 'claude-sonnet-4-6',
    claim: [
      'Read NOTES-4567 via get_ticket. Implemented per the ticket:',
      '{ id, summary }, and a 404 with the { error: { code, message } } envelope.',
    ].join('\n'),
    code: WITH_MCP_CODE,
    checks: [
      { ok: true, label: 'eslint --no-inline-config', detail: 'no problems' },
      { ok: true, label: 'feature.test.js — the agent wrote these', detail: '2 passing' },
      { ok: true, label: 'acceptance.test.js — the hidden judge', detail: '{ id, summary } and the NOTE_NOT_FOUND envelope' },
    ],
    verdict: { ok: true, text: 'all checks pass — ready to merge' },
  },
];

export default function AgentPrReview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const originalRef = useRef<Monaco.editor.ITextModel | null>(null);
  const modelsRef = useRef<Record<string, Monaco.editor.ITextModel>>({});
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState<'nomcp' | 'mcp'>('nomcp');
  const run = RUNS.find((r) => r.key === active)!;

  // Follow the site theme (html[data-theme], set by the header toggle).
  useEffect(() => {
    const resolve = () => setDark(document.documentElement.dataset.theme !== 'light');
    resolve();
    const obs = new MutationObserver(resolve);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const monaco = await import('monaco-editor');
      const setup = await import('../lib/agent-review/monaco-setup');
      if (disposed || !containerRef.current) return;
      setup.setupMonacoEnvironment();
      setup.defineThemes(monaco);
      setup.configureLanguages(monaco);
      monacoRef.current = monaco;

      originalRef.current = monaco.editor.createModel(BASE, 'javascript');
      for (const r of RUNS) modelsRef.current[r.key] = monaco.editor.createModel(r.code, 'javascript');

      const editor = monaco.editor.createDiffEditor(containerRef.current, {
        readOnly: true,
        // Unified (inline) view: one column that reads top to bottom, with the
        // line-number gutter so the +/- markers sit where they do in git.
        // Side-by-side is too cramped inside a prose column.
        renderSideBySide: false,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        stickyScroll: { enabled: false },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        renderOverviewRuler: false,
        scrollbar: { alwaysConsumeMouseWheel: false },
        fontSize: 12.5,
        theme: setup.themeName(document.documentElement.dataset.theme !== 'light'),
      });
      editor.setModel({ original: originalRef.current, modified: modelsRef.current[active] });
      editorRef.current = editor;
    })();

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      originalRef.current?.dispose();
      for (const m of Object.values(modelsRef.current)) m.dispose();
      modelsRef.current = {};
    };
  }, []);

  // Swap the modified side when the reviewer toggles between PRs.
  useEffect(() => {
    if (editorRef.current && originalRef.current && modelsRef.current[active]) {
      editorRef.current.setModel({ original: originalRef.current, modified: modelsRef.current[active] });
    }
  }, [active]);

  useEffect(() => {
    monacoRef.current?.editor.setTheme(dark ? 'agent-dark' : 'agent-light');
  }, [dark]);

  return (
    <div className="apr">
      <div className="apr-tabs" role="tablist">
        {RUNS.map((r) => (
          <button
            key={r.key}
            role="tab"
            aria-selected={active === r.key}
            className={`apr-tab ${active === r.key ? 'on' : ''} ${r.verdict.ok ? 'good' : 'bad'}`}
            onClick={() => setActive(r.key)}
          >
            <span className="apr-tabmark">{r.verdict.ok ? '✓' : '✕'}</span>
            {r.tab}
          </button>
        ))}
      </div>

      <div className="apr-comment">
        <div className="apr-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * Math.PI) / 6;
              return (
                <line
                  key={i}
                  x1={12 + Math.cos(a) * 3.2}
                  y1={12 + Math.sin(a) * 3.2}
                  x2={12 + Math.cos(a) * 9}
                  y2={12 + Math.sin(a) * 9}
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>
        <div className="apr-bubble">
          <div className="apr-author"><strong>{run.model}</strong> opened this PR</div>
          <pre className="apr-claim">{run.claim}</pre>
        </div>
      </div>

      <div className="apr-difflabel">src/app.js · baseline → the run's change</div>
      <div ref={containerRef} className="apr-diff" />

      <div className="apr-checks">
        {run.checks.map((c) => (
          <div key={c.label} className={`apr-check ${c.ok ? 'ok' : 'bad'}`}>
            <span className="apr-mark">{c.ok ? '✓' : '✕'}</span>
            <span className="apr-clabel">{c.label}</span>
            <span className="apr-cdetail">{c.detail}</span>
          </div>
        ))}
        <div className={`apr-verdict ${run.verdict.ok ? 'ok' : 'bad'}`}>{run.verdict.text}</div>
      </div>

      <style>{`
        .apr { margin: 1.6rem 0; border: 1px solid var(--rule); border-radius: 10px; overflow: hidden; background: var(--bg); }
        .apr-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--rule); }
        .apr-tab { flex: 1; font: inherit; font-size: 0.78rem; background: none; border: none; border-bottom: 2px solid transparent; color: var(--muted); cursor: pointer; padding: 0.6rem 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
        .apr-tab.on { color: var(--fg); font-weight: 600; }
        .apr-tab.on.good { border-bottom-color: #2da44e; }
        .apr-tab.on.bad { border-bottom-color: #e5484d; }
        .apr-tabmark { font-weight: 700; }
        .apr-tab.good .apr-tabmark { color: #2da44e; }
        .apr-tab.bad .apr-tabmark { color: #e5484d; }
        .apr-comment { display: flex; gap: 0.7rem; padding: 0.8rem 0.9rem; }
        .apr-avatar { flex: none; width: 30px; height: 30px; border-radius: 50%; background: #d97757; display: flex; align-items: center; justify-content: center; }
        .apr-bubble { flex: 1; min-width: 0; border: 1px solid var(--rule); border-radius: 8px; padding: 0.5rem 0.7rem; }
        .apr-author { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.35rem; }
        .apr-author strong { color: var(--fg); }
        .apr-claim { margin: 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.78rem; line-height: 1.5; white-space: pre-wrap; color: var(--fg); }
        .apr-difflabel { padding: 0.5rem 0.9rem 0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--muted); }
        .apr-diff { height: 440px; margin: 0.4rem 0.6rem 0.2rem; border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; }
        .apr-checks { padding: 0.55rem 0.9rem 0.85rem; border-top: 1px solid var(--rule); }
        .apr-check { display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.8rem; padding: 0.18rem 0; flex-wrap: wrap; }
        .apr-mark { font-weight: 700; width: 1ch; }
        .apr-check.ok .apr-mark { color: #2da44e; }
        .apr-check.bad .apr-mark { color: #e5484d; }
        .apr-clabel { color: var(--fg); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.75rem; }
        .apr-cdetail { color: var(--muted); }
        .apr-verdict { margin-top: 0.5rem; font-size: 0.8rem; font-weight: 600; }
        .apr-verdict.ok { color: #2da44e; }
        .apr-verdict.bad { color: #e5484d; }
      `}</style>
    </div>
  );
}
