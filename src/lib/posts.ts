import { getCollection, type CollectionEntry } from 'astro:content';

/** Posts shown per page on the /posts list. */
export const PAGE_SIZE = 10;

/** Published posts, newest first. */
export async function getSortedPosts(): Promise<CollectionEntry<'posts'>[]> {
  return (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
}

/** URL for a given 1-based page. Page 1 is /posts; later pages are /posts/page/N. */
export function pageUrl(page: number): string {
  return page <= 1 ? '/posts' : `/posts/page/${page}`;
}
