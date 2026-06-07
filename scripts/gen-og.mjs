// Generate the default Open Graph preview image (1200x630) shown when a
// filipkunc.com link is shared on LinkedIn, Slack, X, etc. The design mirrors
// the site's dark palette (see Layout.astro :root). Re-run with `npm run og`
// after a brand/palette change; the PNG is committed to public/og-default.png.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'og-default.png',
);

// Palette pulled from the dark theme in src/layouts/Layout.astro.
const BG = '#0e0e10';
const FG = '#e9e9ea';
const MUTED = '#8a8a8e';
const ACCENT = '#ff6b35';
const RULE = '#2a2a2e';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="22%" cy="30%" r="75%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- accent rule echoing the in-page blockquote/marker accent -->
  <rect x="100" y="232" width="64" height="6" rx="3" fill="${ACCENT}"/>

  <text x="100" y="330" font-family="DejaVu Sans, sans-serif" font-size="92" font-weight="700" fill="${FG}">filipkunc<tspan fill="${ACCENT}">.com</tspan></text>

  <text x="103" y="400" font-family="DejaVu Sans, sans-serif" font-size="40" font-weight="400" fill="${MUTED}">Notes, projects, and experiments by Filip Kunc.</text>

  <line x1="100" y1="500" x2="1100" y2="500" stroke="${RULE}" stroke-width="1"/>
  <text x="100" y="548" font-family="DejaVu Sans Mono, monospace" font-size="30" font-weight="400" fill="${MUTED}">@filipkunc on GitHub</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log(`wrote ${OUT}`);
