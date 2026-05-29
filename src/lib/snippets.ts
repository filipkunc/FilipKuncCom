// Build-time helpers for showing real source code in posts.
//
// The point is that a snippet in a post is never a hand-copied paraphrase: it
// is read straight out of a real file at build time, so it cannot drift from
// the code that actually ships and runs. To show only part of a file, wrap the
// part in `// #region <name>` / `// #endregion` markers (the same markers
// editors fold on) and pull it out by name.
//
// Only ever imported from .astro frontmatter, so Node's fs is fine here.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REGION_START = /^\s*(?:\/\/|#|--|\/\*)\s*#region\s+(\S+)/;
const REGION_END = /^\s*(?:\/\/|#|--|\/\*)\s*#endregion\b/;

export function readSource(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), 'utf8');
}

// Strip the common leading indentation so a region lifted from inside a
// function or class reads as if it stood on its own.
function dedent(lines: string[]): string[] {
  const widths = lines
    .filter((line) => line.trim() !== '')
    .map((line) => line.match(/^[ \t]*/)![0].length);
  const min = widths.length ? Math.min(...widths) : 0;
  return lines.map((line) => line.slice(min));
}

// Return the text inside the named region, with the marker lines removed and
// any nested regions' markers stripped but their content kept. Throws if the
// region is missing or unclosed, so a renamed or deleted region fails the
// build instead of silently showing nothing.
export function extractRegion(code: string, region: string): string {
  const lines = code.split('\n');

  let i = 0;
  for (; i < lines.length; i++) {
    const match = lines[i].match(REGION_START);
    if (match && match[1] === region) break;
  }
  if (i >= lines.length) {
    throw new Error(`extractRegion: region "${region}" not found`);
  }

  i++; // skip the opening marker
  let depth = 1;
  const out: string[] = [];
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (REGION_START.test(line)) {
      depth++;
      continue; // hide nested markers, keep their body
    }
    if (REGION_END.test(line)) {
      depth--;
      if (depth === 0) break;
      continue;
    }
    out.push(line);
  }
  if (depth !== 0) {
    throw new Error(`extractRegion: region "${region}" is not closed`);
  }

  while (out.length && out[0].trim() === '') out.shift();
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  return dedent(out).join('\n');
}
