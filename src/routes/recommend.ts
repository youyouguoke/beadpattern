import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../lib/db';
import { success } from '../lib/response';
import { AppError } from '../lib/errors';
import type { Bindings } from '../lib/env';
import type { Pattern } from '../types';

const recommend = new Hono<{ Bindings: Bindings }>();

recommend.get('/:slug', zValidator('param', z.object({ slug: z.string().min(1) })), async (c) => {
  const db = getDB(c.env);
  const { slug } = c.req.valid('param');
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 4), 1), 20);

  const pattern = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE slug = ? AND status = ?', [slug, 'published']);
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const tagRows = await db.query<{ tag_id: string }>('SELECT tag_id FROM pattern_tags WHERE pattern_id = ?', [pattern.id]);
  const tagIds = tagRows.map((r) => r.tag_id);

  // Build scored recommendations: tag overlap (heaviest), same difficulty, then views/recency.
  const rows = await db.query<{
    id: string;
    slug: string;
    title: string;
    cover_image: string | null;
    difficulty: string;
    grid_size: string | null;
    color_count: number;
    estimated_beads: number;
    color_palette: string | null;
    created_at: string;
    shared_tags: number;
    views: number;
    likes: number;
  }>(
    `SELECT
       p.id,
       p.slug,
       p.title,
       p.cover_image,
       p.difficulty,
       p.grid_size,
       p.color_count,
       p.estimated_beads,
       p.color_palette,
       p.created_at,
       COUNT(pt.tag_id) as shared_tags,
       COALESCE(a.views, 0) as views,
       COALESCE(a.likes, 0) as likes
     FROM patterns p
     LEFT JOIN pattern_tags pt ON pt.pattern_id = p.id AND pt.tag_id IN (${tagIds.length ? tagIds.map(() => '?').join(',') : "''"})
     LEFT JOIN analytics a ON a.pattern_id = p.id
     WHERE p.status = 'published' AND p.id != ?
     GROUP BY p.id
     ORDER BY shared_tags DESC,
              CASE WHEN p.difficulty_id = ? THEN 1 ELSE 0 END DESC,
              views DESC,
              likes DESC,
              p.created_at DESC
     LIMIT ?`,
    [...tagIds, pattern.id, pattern.difficulty_id, limit]
  );

  // If no shared tags, same-difficulty patterns are already promoted by the ORDER BY.
  // Just fill to the limit if needed (should already be limited).
  const formatted = rows.map((r) => ({
    ...r,
    color_palette: r.color_palette ? JSON.parse(r.color_palette) : null,
  }));
  return c.json(success(formatted));
});

export default recommend;
