import { z } from 'zod';
import type { TagType } from '../types';

export const TagTypeEnum: TagType[] = [
  'style',
  'theme',
  'difficulty',
  'animal',
  'object',
  'color',
  'season',
  'character',
];

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'style',
    'theme',
    'difficulty',
    'animal',
    'object',
    'color',
    'season',
    'character',
  ]),
  slug: z.string().min(1).max(120).optional(),
  display_order: z.number().int().optional().default(0),
});

export const ColorSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(100).optional(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  count: z.number().int().nonnegative().optional(),
});

export const PatternStepSchema = z.object({
  description: z.string().max(2000).optional(),
  image: z.string().url().max(1000).optional(),
  grid_data: z.record(z.unknown()).optional(),
});

export const difficultyStringToId = (difficulty: string | number): 1 | 2 | 3 => {
  if (typeof difficulty === 'number') {
    if (difficulty === 1 || difficulty === 2 || difficulty === 3) return difficulty as 1 | 2 | 3;
    return 1;
  }
  switch (difficulty) {
    case 'easy':
      return 1;
    case 'medium':
      return 2;
    case 'hard':
      return 3;
    default:
      return 1;
  }
};

export const DifficultySchema = z.preprocess(
  (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return val.toLowerCase();
    return val;
  },
  z.union([z.enum(['easy', 'medium', 'hard']), z.number().int().min(1).max(3)])
);

export const CreatePatternSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  difficulty: DifficultySchema,
  cover_image: z.string().url().max(1000).optional(),
  finished_image: z.string().url().max(1000).optional(),
  cover_image_r2_key: z.string().max(500).optional(),
  image_updated_at: z.string().datetime().optional(),
  grid_size: z.string().max(50).optional(),
  grid_data: z.array(z.array(z.union([z.string(), z.number()]))).optional(),
  estimated_beads: z.number().int().nonnegative().optional(),
  color_count: z.number().int().nonnegative().optional(),
  color_palette: z.array(z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/), ColorSchema])).max(50).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  tag_slugs: z.array(z.string().min(1)).optional(),
  steps: z.array(PatternStepSchema).max(50).optional(),
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(1000).optional(),
  seo_keywords: z.string().max(1000).optional(),
  canonical: z.string().max(1000).optional(),
  robots: z.string().max(100).optional(),
  og_image: z.string().url().max(1000).optional(),
  twitter_title: z.string().max(200).optional(),
  twitter_description: z.string().max(1000).optional(),
  twitter_image: z.string().url().max(1000).optional(),
  structured_data: z.string().max(5000).optional(),
});

export const UpdatePatternSchema = CreatePatternSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const ListPatternsQuerySchema = z.object({
  tag: z.string().optional(),
  difficulty: DifficultySchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sort: z.enum(['latest', 'popular', 'views']).optional().default('latest'),
  page: z.coerce.number().int().nonnegative().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  q: z.string().max(200).optional(),
});

export const BulkImportRowSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  difficulty: DifficultySchema.optional().default('easy'),
  cover_image: z.string().url().optional(),
  grid_size: z.string().max(50).optional(),
  estimated_beads: z.coerce.number().int().nonnegative().optional(),
  color_count: z.coerce.number().int().nonnegative().optional(),
  color_palette: z.string().optional(), // comma-separated hex
  tags: z.string().optional(), // comma-separated tag slugs
  tag_slugs: z.string().optional(),
});
