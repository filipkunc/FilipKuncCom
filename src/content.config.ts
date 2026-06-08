import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    // Posts are co-located in folders with their images/videos:
    //   posts/<slug>/index.mdx
    //   posts/<slug>/screenshot.png
    //   posts/<slug>/demo.webm
    // Strip the trailing "/index" so the URL stays /posts/<slug>.
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, '').replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    // Recipe for the social preview card (scripts/gen-og.mjs). Omit for a plain
    // title card. `snippet` needs lang + code; `screenshot` needs src (a path
    // relative to the post folder). See gen-og.mjs for how each is rendered.
    og: z
      .object({
        kind: z.enum(['snippet', 'screenshot', 'title']),
        lang: z.string().optional(),
        code: z.string().optional(),
        src: z.string().optional(),
      })
      .optional(),
  }),
});

export const collections = { posts };
