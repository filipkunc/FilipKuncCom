// A tiny source-map reader: turn the v3 `mappings` string into absolute
// (generated -> original) positions so the visualization can draw its links.
// Both oxc and Acorn emit standard v3 maps, so the same reader handles both.

import { decode } from '@jridgewell/sourcemap-codec';

export interface Mapping {
  genLine: number; // 0-based
  genCol: number;
  srcLine: number;
  srcCol: number;
}

// #region vlq-decode
// @jridgewell/sourcemap-codec does the actual work: `decode` VLQ-decodes the
// mappings string AND un-deltas it, returning, per generated line, segments of
// [genColumn, sourceIndex, srcLine, srcColumn, nameIndex] as absolute values.
// All that's left is to flatten the ones that carry an original position.
export function decodeMappings(mappingsField: string): Mapping[] {
  const out: Mapping[] = [];
  decode(mappingsField).forEach((line, genLine) => {
    for (const seg of line) {
      if (seg.length >= 4) {
        out.push({ genLine, genCol: seg[0], srcLine: seg[2]!, srcCol: seg[3]! });
      }
    }
  });
  return out;
}
// #endregion vlq-decode

// Grab the token the mapping lands on in the original source, for display.
function tokenAt(source: string, line: number, col: number): string {
  const text = source.split('\n')[line] ?? '';
  const slice = text.slice(col);
  const m = slice.match(/^\s*([A-Za-z_$][\w$]*|['"][^'"]*['"]|\S{1,12})/);
  return (m ? m[1] : slice.slice(0, 12)).trim();
}

/** A few human-readable mapping rows, e.g. `out 3:9 → src 5:9  resolve`. */
export function summarize(mapJson: string, source: string, max = 8): string[] {
  let parsed: { mappings?: string };
  try {
    parsed = JSON.parse(mapJson);
  } catch {
    return [];
  }
  if (!parsed.mappings) return [];
  const all = decodeMappings(parsed.mappings);
  // Sample across the file rather than just the first few crowded mappings.
  const step = Math.max(1, Math.floor(all.length / max));
  const rows: string[] = [];
  for (let i = 0; i < all.length && rows.length < max; i += step) {
    const m = all[i];
    const tok = tokenAt(source, m.srcLine, m.srcCol);
    rows.push(
      `out ${m.genLine + 1}:${m.genCol} → src ${m.srcLine + 1}:${m.srcCol}` +
        (tok ? `  ${tok}` : ''),
    );
  }
  return rows;
}

/** Total mapping count, for the summary line. */
export function mappingCount(mapJson: string): number {
  try {
    const parsed = JSON.parse(mapJson) as { mappings?: string };
    return parsed.mappings ? decodeMappings(parsed.mappings).length : 0;
  } catch {
    return 0;
  }
}
