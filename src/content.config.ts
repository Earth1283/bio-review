import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const units = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/units' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
  }),
});

export const collections = { units };
