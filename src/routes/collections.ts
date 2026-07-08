import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../lib/db';
import { success } from '../lib/response';
import { AppError } from '../lib/errors';
import { difficultyStringToId } from '../lib/schemas';
import type { Bindings } from '../lib/env';

const collections = new Hono<{ Bindings: Bindings }>();

collections.get('/', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<
    { id: string; slug: string; title: string; description: string | null; banner: string | null; display_order: number; published: number; created_at: string; updated_at: string; pattern_count: number }
  >(
    `SELECT c.*, COUNT(pc.pattern_id) AS pattern_count
     FROM collections c
     LEFT JOIN pattern_collections pc ON pc.collection_id = c.id
     LEFT JOIN patterns p ON p.id = pc.pattern_id AND p.status = 'published'
     WHERE c.published = 1
     GROUP BY c.id
     ORDER BY c.display_order ASC, c.created_at DESC`
  );
  return c.json(success(rows));
});

collections.get('/:slug', zValidator('param', z.object({ slug: z.string().min(1) })), async (c) => {
  const { slug } = c.req.valid('param');
  const db = getDB(c.env);
  const collection = await db.queryOne<
    { id: string; slug: string; title: string; description: string | null; banner: string | null; display_order: number; published: number; created_at: string; updated_at: string }
  >('SELECT * FROM collections WHERE slug = ? AND published = 1', [slug]);
  if (!collection) throw new AppError('Collection not found', 'NOT_FOUND', 404);

  const page = Math.max(1, Number(c.req.query('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 20)));
  const offset = (page - 1) * limit;

  const patterns = await db.query<
    { id: string; slug: string; title: string; description: string | null; cover_image: string | null; difficulty: string; grid_size: string | null; color_count: number; estimated_beads: number; created_at: string; updated_at: string; views: number; likes: number }
  >(
    `SELECT
       p.id, p.slug, p.title, p.description, p.cover_image, p.difficulty, p.grid_size,
       p.color_count, p.estimated_beads, p.created_at, p.updated_at,
       COALESCE(a.views, 0) as views, COALESCE(a.likes, 0) as likes
     FROM patterns p
     JOIN pattern_collections pc ON pc.pattern_id = p.id
     LEFT JOIN analytics a ON a.pattern_id = p.id
     WHERE pc.collection_id = ? AND p.status = 'published'
     ORDER BY pc.display_order ASC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    [collection.id, limit, offset]
  );

  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM patterns p
     JOIN pattern_collections pc ON pc.pattern_id = p.id
     WHERE pc.collection_id = ? AND p.status = 'published'`,
    [collection.id]
  );
  const total = countRow?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return c.json(success({
    collection,
    patterns,
    pagination: { page, limit, total, totalPages },
  }));
});

export default collections;
