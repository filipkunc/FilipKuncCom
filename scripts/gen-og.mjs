// Generate Open Graph preview images (1200x630) shown when a filipkunc.com
// link is shared (LinkedIn, Slack, X, ...). Outputs:
//   public/og-default.png   the site-wide fallback banner
//   public/og/<slug>.png    one per post, from a per-post recipe below
//
// Three recipes, all rendered without a browser:
//   snippet     a hand-picked code sample, highlighted with the same Shiki
//               theme the site uses (github-dark), laid out as an editor panel
//   screenshot  an existing post asset composited onto the branded frame
//   title       a plain title card (the default look) for text-only posts
//
// Palette mirrors the dark theme in src/layouts/Layout.astro. Re-run with
// `npm run og` after changing a recipe, a snippet, or the palette.
import sharp from 'sharp';
import { codeToTokens } from 'shiki';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = path.join(ROOT, 'src', 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'public', 'og');

const W = 1200;
const H = 630;
const M = 80; // outer margin

const BG = '#0e0e10';
const FG = '#e9e9ea';
const MUTED = '#8a8a8e';
const ACCENT = '#ff6b35';
const RULE = '#2a2a2e';
const PANEL_BG = '#17171a';

// Approx glyph advance as a fraction of font size, used to fit text to a box.
const MONO_ADV = 0.62; // DejaVu Sans Mono
const SANS_ADV = 0.56; // DejaVu Sans

// --- per-post recipes -------------------------------------------------------
// Code snippets are lifted (and lightly trimmed) from each post's own source so
// the card shows something the post actually contains.
const RECIPES = {
  'gpu-normals': {
    kind: 'snippet',
    lang: 'wgsl',
    code: `@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let v = gid.x;
  if (v >= counts.vertexCount) { return; }

  // One thread per vertex gathers its triangles. No atomics.
  var n = vec3<f32>(0.0, 0.0, 0.0);
  for (var i = adjStart[v]; i < adjStart[v + 1u]; i = i + 1u) {
    n = n + faceNormal(adjTris[i]);
  }
  if (dot(n, n) > 0.0) { n = normalize(n); }
}`,
  },
  'code-search': {
    kind: 'snippet',
    lang: 'rust',
    code: `/// A boolean query over trigrams every match must contain.
pub enum Query {
    All,
    None,
    Trigram(String),
    And(Vec<Query>),
    Or(Vec<Query>),
}

/// Trigrams: every three-byte window of a string.
pub fn trigrams(s: &str) -> BTreeSet<String> {
    s.as_bytes().windows(3)
        .map(|w| String::from_utf8_lossy(w).into_owned())
        .collect()
}`,
  },
  'cpp-data-races': {
    kind: 'snippet',
    lang: 'cpp',
    code: `// The same loop on every core, with no synchronization.
int counter = 0;
parallel_for(num_cores, [&] {
    for (int i = 0; i < 1'000'000; i++)
        counter++;            // torn reads, lost writes
});
// counter now lands well below num_cores * 1'000'000.`,
  },
  'monkey-patching': {
    kind: 'snippet',
    lang: 'js',
    code: `import fs from 'node:fs';

const original = fs.readFileSync;
fs.readFileSync = (...args) =>
  original(...args).replace('Hello, world!', 'Hello, Filip!');

process.stdout.write(fs.readFileSync('hello.txt', 'utf8'));`,
  },
  'header-only-libs': {
    kind: 'snippet',
    lang: 'c',
    code: `// In exactly one .c file, define the implementation:
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

// Everywhere else, just include the header:
int w, h, channels;
unsigned char* pixels =
    stbi_load("cat.png", &w, &h, &channels, 4);`,
  },
  'type-json-validator': {
    kind: 'snippet',
    lang: 'ts',
    code: `// 1. Infer a type from a sample value.
const typeText = inferType(sample);

// 2. Generate a validator by walking that type.
const { validate } = await generateValidator(typeText);

// 3. Run it. The real value passes; a broken one fails.
validate(sample);  // => true
validate(broken);  // => false`,
  },
  'local-llm-arena': {
    kind: 'snippet',
    lang: 'python',
    code: `class T:
    def __init__(self, v, l=None, r=None):
        self.val, self.left, self.right = v, l, r

def equal(a, b):
    if a is None or b is None:
        return a is b
    return (a.val == b.val
            and equal(a.left, b.left)
            and equal(a.right, b.right))`,
  },
  'gemini-game-art': {
    kind: 'screenshot',
    src: 'gemini-game-art/sprite-editor-generate-monster.png',
  },
  'old-stuff': {
    kind: 'screenshot',
    src: 'old-stuff/space-warrior.png',
  },
  'meshmaker': {
    kind: 'screenshot',
    src: 'meshmaker/unwrap.png',
  },
  'work-life': { kind: 'title' },
};

// --- helpers ----------------------------------------------------------------
const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Read the frontmatter title so the card label stays in sync with the post.
function readTitle(slug) {
  const mdx = fs.readFileSync(path.join(POSTS, slug, 'index.mdx'), 'utf8');
  const m = mdx.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return m ? m[1] : slug;
}

// Greedy word-wrap to at most `maxLines`, ellipsising the last line if needed.
function wrap(text, maxChars, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = word;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = next;
    }
  }
  const rest = words.slice(lines.join(' ').split(/\s+/).filter(Boolean).length).join(' ');
  if (lines.length < maxLines) lines.push(rest || cur);
  let last = lines[lines.length - 1];
  if (last.length > maxChars) last = last.slice(0, maxChars - 1).trimEnd() + '…';
  lines[lines.length - 1] = last;
  return lines.filter(Boolean);
}

// The shared frame: background, accent glow, accent rule, and footer wordmark.
function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="20%" cy="22%" r="80%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.15"/>
      <stop offset="55%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${inner}
  <text x="${M}" y="${H - 36}" font-family="DejaVu Sans Mono, monospace" font-size="24" fill="${MUTED}">filipkunc.com</text>
</svg>`;
}

// Title eyebrow above a content panel (snippet/screenshot cards).
function eyebrow(title) {
  const lines = wrap(title, 50, 2);
  const fs1 = 34;
  const lh = 44;
  const rule = `<rect x="${M}" y="58" width="56" height="6" rx="3" fill="${ACCENT}"/>`;
  const text = lines
    .map(
      (l, i) =>
        `<text x="${M}" y="${112 + i * lh}" font-family="DejaVu Sans, sans-serif" font-size="${fs1}" font-weight="700" fill="${FG}">${escapeXml(l)}</text>`,
    )
    .join('\n  ');
  return rule + '\n  ' + text;
}

// Convert Shiki token lines into SVG <text> rows. One <text> per line; tokens
// flow as <tspan>s, so no per-glyph x math is needed (monospace).
function tokensToSvg(tokenLines, x, startY, fontSize, lineH, defaultFg) {
  return tokenLines
    .map((toks, i) => {
      const y = (startY + i * lineH).toFixed(1);
      const spans = toks
        .map((t) => {
          const fill = t.color || defaultFg;
          const bits = t.fontStyle > 0 ? t.fontStyle : 0;
          let style = '';
          if (bits & 1) style += 'font-style:italic;';
          if (bits & 2) style += 'font-weight:bold;';
          return `<tspan fill="${fill}"${style ? ` style="${style}"` : ''}>${escapeXml(t.content)}</tspan>`;
        })
        .join('');
      return `<text x="${x}" y="${y}" xml:space="preserve" font-family="DejaVu Sans Mono, monospace" font-size="${fontSize.toFixed(1)}">${spans}</text>`;
    })
    .join('\n  ');
}

async function snippetCard(title, lang, code) {
  const { tokens, fg } = await codeToTokens(code.replace(/\n$/, ''), {
    lang,
    theme: 'github-dark',
  });
  const lines = code.replace(/\n$/, '').split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length));
  const n = lines.length;

  // Panel geometry. Header strip holds traffic-light dots + a language label.
  const px = M;
  const py = 200;
  const pw = W - 2 * M;
  const ph = H - py - 86; // leave room for the footer
  const headerH = 52;
  const padX = 32;
  const codeTop = py + headerH + 18;
  const codeH = ph - headerH - 36;
  const innerW = pw - 2 * padX;

  // Fit the code to the panel by width and height; cap for readability.
  const fsW = innerW / (maxLen * MONO_ADV);
  const fsH = codeH / (n * 1.5);
  const fontSize = Math.min(30, fsW, fsH);
  const lineH = fontSize * 1.5;
  const blockH = n * lineH;
  const startY = codeTop + (codeH - blockH) / 2 + fontSize * 0.8;

  const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
    .map((c, i) => `<circle cx="${px + 28 + i * 26}" cy="${py + headerH / 2}" r="7" fill="${c}"/>`)
    .join('');
  const langLabel = `<text x="${px + pw - padX}" y="${py + headerH / 2 + 7}" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="20" fill="${MUTED}">${escapeXml(lang)}</text>`;

  const panel = `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="14" fill="${PANEL_BG}" stroke="${RULE}"/>
  <line x1="${px}" y1="${py + headerH}" x2="${px + pw}" y2="${py + headerH}" stroke="${RULE}"/>
  ${dots}
  ${langLabel}`;

  const codeSvg = tokensToSvg(tokens, px + padX, startY, fontSize, lineH, fg);
  return frame(`${eyebrow(title)}\n  ${panel}\n  ${codeSvg}`);
}

function titleCard(title) {
  const lines = wrap(title, 22, 3);
  const fs1 = 72;
  const lh = 86;
  const startY = (H - lines.length * lh) / 2 + 64;
  const rule = `<rect x="${M}" y="${startY - 96}" width="64" height="6" rx="3" fill="${ACCENT}"/>`;
  const text = lines
    .map(
      (l, i) =>
        `<text x="${M}" y="${startY + i * lh}" font-family="DejaVu Sans, sans-serif" font-size="${fs1}" font-weight="700" fill="${FG}">${escapeXml(l)}</text>`,
    )
    .join('\n  ');
  return frame(`${rule}\n  ${text}`);
}

// Default banner: the site tagline, used as the global fallback og:image.
function defaultCard() {
  const inner = `<rect x="${M}" y="232" width="64" height="6" rx="3" fill="${ACCENT}"/>
  <text x="${M}" y="330" font-family="DejaVu Sans, sans-serif" font-size="92" font-weight="700" fill="${FG}">filipkunc<tspan fill="${ACCENT}">.com</tspan></text>
  <text x="${M + 3}" y="400" font-family="DejaVu Sans, sans-serif" font-size="40" fill="${MUTED}">Notes, projects, and experiments by Filip Kunc.</text>
  <line x1="${M}" y1="500" x2="${W - M}" y2="500" stroke="${RULE}"/>`;
  // defaultCard reuses the frame footer, so render it directly.
  return frame(inner);
}

async function render(svg, outPath, composite) {
  let img = sharp(Buffer.from(svg));
  if (composite) img = img.composite(composite);
  await img.png().toFile(outPath);
}

async function screenshotComposite(srcRel) {
  // Title eyebrow + a panel that contains the screenshot (fit inside, centered).
  const px = M;
  const py = 200;
  const pw = W - 2 * M;
  const ph = H - py - 86;
  const pad = 14;
  const innerW = pw - 2 * pad;
  const innerH = ph - 2 * pad;

  const shot = await sharp(path.join(POSTS, srcRel))
    .resize(Math.round(innerW), Math.round(innerH), { fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(shot).metadata();
  const left = Math.round(px + pad + (innerW - meta.width) / 2);
  const top = Math.round(py + pad + (innerH - meta.height) / 2);

  const panel = `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="14" fill="${PANEL_BG}" stroke="${RULE}"/>`;
  return { panel, composite: { input: shot, left, top } };
}

// --- main -------------------------------------------------------------------
await fsp.mkdir(OUT_DIR, { recursive: true });

await render(defaultCard(), path.join(ROOT, 'public', 'og-default.png'));
console.log('wrote public/og-default.png');

for (const [slug, recipe] of Object.entries(RECIPES)) {
  const out = path.join(OUT_DIR, `${slug}.png`);
  const title = readTitle(slug);
  if (recipe.kind === 'snippet') {
    await render(await snippetCard(title, recipe.lang, recipe.code), out);
  } else if (recipe.kind === 'screenshot') {
    const { panel, composite } = await screenshotComposite(recipe.src);
    await render(frame(`${eyebrow(title)}\n  ${panel}`), out, [composite]);
  } else {
    await render(titleCard(title), out);
  }
  console.log(`wrote public/og/${slug}.png  (${recipe.kind})`);
}
