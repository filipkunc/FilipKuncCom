import { useMemo, useState } from 'react';
import { decodeMappings, type Mapping } from '../lib/ast-explorer/sourcemap';

// An Evan-Wallace-style source-map visualization: the original source and the
// generated code side by side, with each mapping painted the same color in both
// panes. Hovering a colored span lights up its counterpart, so you can see
// exactly which output span came from which source span — the thing a source map
// encodes, made visible. https://evanw.github.io/source-map-visualization/

interface Props {
  source: string;
  code: string;
  mapJson: string;
}

interface Segment {
  text: string;
  idx: number; // mapping index, or -1 for unmapped text
}

// Distinct, evenly-spread hues via the golden angle; same idx -> same color in
// both panes, which is what makes the link readable.
function hue(idx: number): number {
  return (idx * 137.508) % 360;
}

// Split `text` into lines, then each line into colored segments according to the
// column positions in `byLine` (a sorted list of {col, idx} per line).
function paint(text: string, byLine: Map<number, { col: number; idx: number }[]>): Segment[][] {
  return text.split('\n').map((line, ln) => {
    const points = byLine.get(ln);
    if (!points || points.length === 0) return [{ text: line, idx: -1 }];
    const segs: Segment[] = [];
    let cursor = 0;
    points.forEach((p, i) => {
      const start = Math.min(p.col, line.length);
      if (start > cursor) segs.push({ text: line.slice(cursor, start), idx: -1 });
      const end = i + 1 < points.length ? Math.min(points[i + 1].col, line.length) : line.length;
      if (end > start) segs.push({ text: line.slice(start, end), idx: p.idx });
      cursor = Math.max(cursor, end);
    });
    if (cursor < line.length) segs.push({ text: line.slice(cursor), idx: -1 });
    return segs;
  });
}

export default function SourceMapViz({ source, code, mapJson }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const model = useMemo(() => {
    let mappings: Mapping[] = [];
    try {
      const parsed = JSON.parse(mapJson) as { mappings?: string };
      if (parsed.mappings) mappings = decodeMappings(parsed.mappings);
    } catch {
      /* fall through to empty */
    }
    // DOM spans don't scale to thousands of mappings; cap and note it.
    const tooBig = mappings.length > 600 || source.length > 12000;
    if (tooBig) return { tooBig, mappings: mappings.length };

    const genByLine = new Map<number, { col: number; idx: number }[]>();
    const srcByLine = new Map<number, { col: number; idx: number }[]>();
    mappings.forEach((m, idx) => {
      (genByLine.get(m.genLine) ?? genByLine.set(m.genLine, []).get(m.genLine)!).push({
        col: m.genCol,
        idx,
      });
      (srcByLine.get(m.srcLine) ?? srcByLine.set(m.srcLine, []).get(m.srcLine)!).push({
        col: m.srcCol,
        idx,
      });
    });
    for (const list of genByLine.values()) list.sort((a, b) => a.col - b.col);
    for (const list of srcByLine.values()) list.sort((a, b) => a.col - b.col);

    return {
      tooBig: false,
      mappings: mappings.length,
      original: paint(source, srcByLine),
      generated: paint(code, genByLine),
    };
  }, [source, code, mapJson]);

  if (model.tooBig) {
    return (
      <div className="smv-note">
        {model.mappings} mappings — too many to paint inline. The visualization is
        meant for the smaller examples; pick <strong>ESM imports</strong> or{' '}
        <strong>TypeScript</strong> to see it.
      </div>
    );
  }

  const renderPane = (lines: Segment[][], label: string) => (
    <div className="smv-pane">
      <div className="smv-pane-head">{label}</div>
      <pre className="smv-code">
        {lines.map((segs, ln) => (
          <div className="smv-line" key={ln}>
            <span className="smv-ln">{ln + 1}</span>
            <span className="smv-line-body">
              {segs.map((s, i) =>
                s.idx < 0 ? (
                  <span key={i}>{s.text}</span>
                ) : (
                  <span
                    key={i}
                    className={'smv-seg' + (hovered === s.idx ? ' on' : '')}
                    style={{
                      backgroundColor: `hsl(${hue(s.idx)} 70% 50% / ${hovered === s.idx ? 0.55 : 0.22})`,
                    }}
                    onMouseEnter={() => setHovered(s.idx)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {s.text}
                  </span>
                ),
              )}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );

  return (
    <div className="smv">
      <div className="smv-cols">
        {renderPane(model.original!, 'original')}
        {renderPane(model.generated!, 'generated')}
      </div>
      <p className="smv-hint">
        {model.mappings} mappings · hover a colored span to light up where it came from.
      </p>

      <style>{`
        .smv { display: flex; flex-direction: column; height: 300px; }
        .smv-cols {
          display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: minmax(0, 1fr);
          gap: 0; flex: 1 1 auto; min-height: 0;
        }
        .smv-pane {
          display: flex; flex-direction: column; min-width: 0; min-height: 0;
          border-right: 1px solid var(--rule);
        }
        .smv-pane:last-child { border-right: none; }
        .smv-pane-head {
          flex: 0 0 auto;
          font-size: 0.7rem; color: var(--muted); padding: 0.3rem 0.6rem;
          border-bottom: 1px solid var(--rule); text-transform: uppercase; letter-spacing: 0.04em;
        }
        .smv-code {
          margin: 0; flex: 1 1 auto; min-height: 0; overflow: auto; padding: 0.4rem 0;
          font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; line-height: 1.5;
          white-space: pre; tab-size: 2;
        }
        .smv-line { display: flex; }
        .smv-ln {
          flex: 0 0 2.2rem; text-align: right; padding-right: 0.6rem;
          color: var(--muted); opacity: 0.5; user-select: none;
        }
        .smv-line-body { white-space: pre; }
        .smv-seg { border-radius: 2px; cursor: pointer; }
        .smv-seg.on { outline: 1px solid hsl(0 0% 100% / 0.5); }
        .smv-hint { color: var(--muted); font-size: 0.75rem; margin: 0.5rem 0 0; }
        .smv-note { color: var(--muted); font-size: 0.85rem; padding: 1rem; }
      `}</style>
    </div>
  );
}
