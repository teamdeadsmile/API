import { z } from 'zod';

const imageUrl = z
  .string()
  .trim()
  .max(2_000)
  .refine(
    (v) => !v || v.startsWith('https://') || v.startsWith('/'),
    'Use an HTTPS URL or a relative path for images.'
  )
  .optional()
  .nullable();

const httpsUrl = z.string().trim().max(2_000).url().optional().nullable();

export const newsletterPostSchema = z
  .object({
    title:   z.string().trim().min(2).max(180),
    excerpt: z.string().trim().max(500).optional().default(''),
    body:    z.string().trim().min(1).max(30_000),
    image:   imageUrl,
  })
  .strict();

export const videoPostSchema = z
  .object({
    title:           z.string().trim().min(2).max(180),
    category:        z.string().trim().min(1).max(80),
    thumbnail:       imageUrl,
    videoUrl:        httpsUrl,
    durationSeconds: z.coerce.number().int().min(0).max(86_400).optional().nullable(),
  })
  .strict();

export const gamePostSchema = z
  .object({
    title:            z.string().trim().min(2).max(180),
    slug:             z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
    shortDescription: z.string().trim().min(1).max(500),
    description:      z.string().trim().max(30_000).optional().default(''),
    status:           z.enum(['announced', 'in_development', 'released']).default('announced'),
    releaseDate:      z.string().date().optional().nullable(),
    heroImage:        imageUrl,
    coverImage:       imageUrl,
    trailerUrl:       httpsUrl,
    featured:         z.boolean().default(false),
    genres:           z.array(z.string().trim().min(1).max(50)).max(10).default([]),
    platforms:        z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  })
  .strict();
