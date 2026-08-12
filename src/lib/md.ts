// Render a markdown string with the same treatment posts get: GFM, math via
// KaTeX, and shiki dual-theme syntax highlighting (dark baked inline, light
// swapped by Layout's .astro-code CSS). For component-rendered content like
// captured model responses and trace attributes.
import { createMarkdownProcessor, type MarkdownRenderer } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// markdown-remark 7 renamed what createMarkdownProcessor hands back:
// MarkdownProcessor is now the factory, MarkdownRenderer the thing with
// .render(). The call below is unchanged.
let processor: Promise<MarkdownRenderer> | null = null;

export function renderMd(src: string): Promise<string> {
  processor ??= createMarkdownProcessor({
    gfm: true,
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'dark',
    },
  });
  return processor.then(async (p) => String((await p.render(src)).code));
}
