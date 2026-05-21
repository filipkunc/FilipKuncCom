import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() ?? 'https://filipkunc.com/').replace(/\/$/, '');

  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const out: string[] = [];
  out.push('# filipkunc.com');
  out.push('');
  out.push('> Personal site of Filip Kunc: notes, projects, and experiments. Source code runs on a single Hetzner box, deployed via a script you can read end-to-end.');
  out.push('');
  out.push('## Author');
  out.push('');
  out.push('- [@filipkunc on GitHub](https://github.com/filipkunc): Source code for this site and other projects.');
  out.push('');
  out.push('## Posts');
  out.push('');
  out.push(`- [Posts index](${base}/posts): All blog posts.`);
  for (const post of posts) {
    const desc = post.data.description ? `: ${post.data.description}` : '';
    out.push(`- [${post.data.title}](${base}/posts/${post.id})${desc}`);
  }
  out.push('');
  out.push('## Projects');
  out.push('');
  out.push(`- [MeshMaker](${base}/meshmaker): WebGL2 + WASM port of a desktop 3D mesh editor.`);
  out.push('');

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
