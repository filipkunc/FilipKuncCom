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
  integrations: [
    mdx(),
    sitemap({
      // Skip /meshmaker/* — that's MeshMakerWeb's own app, not site content.
      filter: (page) => !page.includes('/meshmaker/'),
    }),
  ],
});
