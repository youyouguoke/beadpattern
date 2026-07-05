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

export const CreatePatternSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
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
});

export const UpdatePatternSchema = CreatePatternSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const ListPatternsQuerySchema = z.object({
  tag: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
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
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  cover_image: z.string().url().optional(),
  grid_size: z.string().max(50).optional(),
  estimated_beads: z.coerce.number().int().nonnegative().optional(),
  color_count: z.coerce.number().int().nonnegative().optional(),
  color_palette: z.string().optional(), // comma-separated hex
  tags: z.string().optional(), // comma-separated tag slugs
  tag_slugs: z.string().optional(),
});
