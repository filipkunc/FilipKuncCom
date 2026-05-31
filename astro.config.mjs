import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import fs from 'node:fs';
import path from 'node:path';

// Dev-only middleware: rewrite `/foo` to `/foo/index.html` when
// `public/foo/index.html` exists. Mirrors what src/server/index.ts does
// in production, so /meshmaker, /space-warrior etc. resolve in `astro dev`
// without needing the explicit `.html` suffix.
const publicDirIndex = {
  name: 'public-dir-index',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? '/';
      const [pathOnly, query] = url.split('?', 2);
      if (pathOnly !== '/' && !path.extname(pathOnly) && !pathOnly.endsWith('/')) {
        const candidate = path.join(process.cwd(), 'public', pathOnly, 'index.html');
        if (fs.existsSync(candidate)) {
          req.url = pathOnly + '/index.html' + (query ? '?' + query : '');
        }
      }
      next();
    });
  },
};

export default defineConfig({
  site: 'https://filipkunc.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  vite: {
    plugins: [publicDirIndex],
    // Monaco's language services ship as ES module workers.
    worker: { format: 'es' },
  },
  image: {
    // 'constrained' = image fills its container up to its intrinsic width,
    // emits <img srcset sizes> so the browser picks the right resolution
    // (including 2x for high-DPI screens). Applies to Markdown ![]() too.
    layout: 'constrained',
  },
  // KaTeX for math in posts. mdx() inherits these by default
  // (extendMarkdownConfig), so $inline$ and $$block$$ work in .mdx too.
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      // Skip embedded apps' own routes — they're not site content.
      filter: (page) =>
        !page.includes('/meshmaker/') &&
        !page.includes('/space-warrior/') &&
        !page.includes('/gentis/'),
    }),
  ],
});
