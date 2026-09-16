import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string(),
    description: z.string(),
    role: z.string(),
    period: z.string(),
    url: z.url().optional(),
    image: z.string().optional(),
    accent: z.enum(['lime', 'coral', 'violet']),
    order: z.number(),
    featured: z.boolean().default(true),
    skills: z.array(z.string()),
  }),
});

export const collections = { projects };
