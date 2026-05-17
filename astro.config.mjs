import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://filipkunc.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  image: {
    // 'constrained' = image fills its container up to its intrinsic width,
    // emits <img srcset sizes> so the browser picks the right resolution
    // (including 2x for high-DPI screens). Applies to Markdown ![]() too.
    layout: 'constrained',
  },
  integrations: [
    mdx(),
    sitemap({
      // Skip /meshmaker/* — that's MeshMakerWeb's own app, not site content.
      filter: (page) => !page.includes('/meshmaker/'),
    }),
  ],
});
