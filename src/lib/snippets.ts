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
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const REGION_START = /^\s*(?:\/\/|#|--|\/\*|<!--)\s*#region\s+(\S+)/;
const REGION_END = /^\s*(?:\/\/|#|--|\/\*|<!--)\s*#endregion\b/;

// The public repository these sources live in, for "view on GitHub" links.
const SOURCE_REPO = 'filipkunc/FilipKuncCom';

export function readSource(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), 'utf8');
}

// The git ref to pin source links to. The deploy passes the deployed commit as
// GIT_SHA, which makes the line anchors permanent. Locally we read HEAD, and if
// there is no git (e.g. building inside a context with no .git) we fall back to
// the default branch so the link still resolves, just unpinned.
let cachedRef: string | undefined;
function sourceRef(): string {
  if (cachedRef !== undefined) return cachedRef;
  const env = process.env.GIT_SHA?.trim();
  if (env && env !== 'unknown') {
    cachedRef = env;
    return cachedRef;
  }
  try {
    cachedRef = execSync('git rev-parse HEAD', { cwd: process.cwd() }).toString().trim();
  } catch {
    cachedRef = 'main';
  }
  return cachedRef;
}

// A GitHub blob URL for a file, optionally anchored to a line range. Pinned to
// the build's commit so the anchored lines never drift.
export function sourceUrl(relPath: string, startLine?: number, endLine?: number): string {
  const path = relPath.replace(/^\/+/, '');
  let url = `https://github.com/${SOURCE_REPO}/blob/${sourceRef()}/${path}`;
  if (startLine) {
    url += `#L${startLine}${endLine && endLine !== startLine ? `-L${endLine}` : ''}`;
  }
  return url;
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

export interface Region {
  code: string;
  // 1-based line numbers of the region's body in the original file (the lines
  // between the markers), for anchoring a source link.
  startLine: number;
  endLine: number;
}

// Locate the named region: its de-indented body plus the line range it spans in
// the original file. Markers are removed and nested regions' markers stripped
// (their content kept). Throws if the region is missing or unclosed, so a
// renamed or deleted region fails the build instead of silently showing nothing.
export function locateRegion(code: string, region: string): Region {
  const lines = code.split('\n');

  let i = 0;
  for (; i < lines.length; i++) {
    const match = lines[i].match(REGION_START);
    if (match && match[1] === region) break;
  }
  if (i >= lines.length) {
    throw new Error(`locateRegion: region "${region}" not found`);
  }

  const startLine = i + 2; // first body line (1-based) sits just after the marker
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
    throw new Error(`locateRegion: region "${region}" is not closed`);
  }
  const endLine = i; // closing marker is at i+1 (1-based), so last body line is i

  while (out.length && out[0].trim() === '') out.shift();
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  return { code: dedent(out).join('\n'), startLine, endLine };
}

export function extractRegion(code: string, region: string): string {
  return locateRegion(code, region).code;
}
