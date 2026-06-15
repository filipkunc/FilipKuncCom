import { useMemo, useState } from 'react';

// A collapsible AST tree, the astexplorer-style view of the ESTree JSON. Each
// node shows its `type` as a label; children render lazily on expand, so even a
// multi-megabyte tree stays cheap while collapsed. Big arrays are capped.

const ARRAY_CAP = 200;

function preview(node: Record<string, unknown>): string {
  for (const k of ['name', 'value', 'kind', 'operator', 'raw']) {
    const v = node[k];
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      return String(v).slice(0, 32);
    }
  }
  return '';
}

function Key({ name }: { name: string }) {
  return name ? <span className="astt-key">{name}: </span> : null;
}

function Leaf({ name, value }: { name: string; value: unknown }) {
  const cls =
    typeof value === 'string'
      ? 'astt-str'
      : typeof value === 'number'
        ? 'astt-num'
        : 'astt-kw';
  const text = typeof value === 'string' ? `"${value}"` : String(value);
  return (
    <div className="astt-row">
      <Key name={name} />
      <span className={cls}>{text}</span>
    </div>
  );
}

function Node({ name, value, depth }: { name: string; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2);

  if (value === null || typeof value !== 'object') {
    return <Leaf name={name} value={value} />;
  }

  const isArray = Array.isArray(value);
  const obj = value as Record<string, unknown>;
  const entries: [string, unknown][] = isArray
    ? (value as unknown[]).slice(0, ARRAY_CAP).map((v, i) => [String(i), v])
    : Object.entries(obj).filter(([k]) => k !== 'type'); // type is in the label
  const hidden = isArray ? Math.max(0, (value as unknown[]).length - ARRAY_CAP) : 0;

  const label = isArray
    ? `[${(value as unknown[]).length}]`
    : typeof obj.type === 'string'
      ? obj.type
      : '{ }';

  return (
    <div className="astt-node">
      <div className="astt-row astt-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="astt-caret">{open ? '▾' : '▸'}</span>
        <Key name={name} />
        <span className={isArray ? 'astt-arr' : 'astt-type'}>{label}</span>
        {!open && !isArray && <span className="astt-preview">{preview(obj)}</span>}
      </div>
      {open && (
        <div className="astt-children">
          {entries.map(([k, v]) => (
            <Node key={k} name={k} value={v} depth={depth + 1} />
          ))}
          {hidden > 0 && <div className="astt-row astt-more">… {hidden} more</div>}
        </div>
      )}
    </div>
  );
}

export default function AstTree({ json }: { json: string }) {
  const root = useMemo<unknown>(() => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [json]);

  if (root == null) return <div className="astt-empty">—</div>;

  return (
    <div className="astt">
      <Node name="" value={root} depth={0} />
      <style>{`
        .astt {
          height: 300px; overflow: auto; padding: 0.5rem 0.75rem;
          font-family: 'JetBrains Mono', monospace; font-size: 0.76rem; line-height: 1.55;
        }
        .astt-row { white-space: nowrap; }
        .astt-toggle { cursor: pointer; user-select: none; }
        .astt-toggle:hover { background: hsl(0 0% 50% / 0.08); }
        .astt-caret { display: inline-block; width: 1rem; color: var(--muted); opacity: 0.7; }
        .astt-children { padding-left: 1rem; border-left: 1px solid hsl(0 0% 50% / 0.15); margin-left: 0.5rem; }
        .astt-key { color: var(--muted); }
        .astt-type { color: var(--accent); font-weight: 600; }
        .astt-arr { color: var(--muted); }
        .astt-preview { color: var(--fg); opacity: 0.6; margin-left: 0.5rem; }
        .astt-str { color: #3fb950; }
        .astt-num { color: #d29922; }
        .astt-kw { color: #a371f7; }
        .astt-more { color: var(--muted); opacity: 0.6; padding-left: 1rem; }
        .astt-empty { color: var(--muted); padding: 1rem; }
      `}</style>
    </div>
  );
}
