import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  return rss({
    title: 'filipkunc.com',
    description: 'Notes, projects, and experiments by Filip Kunc.',
    // context.site is https://filipkunc.com (from astro.config `site`); item
    // links below are resolved against it into absolute URLs.
    site: context.site!,
    // Match astro.config `trailingSlash: 'never'` so feed links equal canonical URLs.
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.id}`,
    })),
  });
};
