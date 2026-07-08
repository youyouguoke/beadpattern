import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../lib/db';
import { success, paginated } from '../lib/response';
import { difficultyStringToId } from '../lib/schemas';
import type { Bindings } from '../lib/env';

const search = new Hono<{ Bindings: Bindings }>();

search.get('/', zValidator('query', z.object({
  q: z.string().max(200).optional(),
  difficulty: z.union([z.enum(['easy', 'medium', 'hard']), z.coerce.number().int().min(1).max(3)]).optional(),
  tag: z.string().max(100).optional(),
  sort: z.enum(['newest', 'popular', 'views', 'likes']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
})), async (c) => {
  const db = getDB(c.env);
  const query = c.req.valid('query');
  const q = (query.q ?? '').trim();
  const difficulty = query.difficulty;
  const tag = query.tag;
  const sort = query.sort ?? 'newest';
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const where: string[] = ["p.status = 'published'"];
  const params: unknown[] = [];

  if (q) {
    // Try FTS5 first; if the virtual table is missing, fall back to LIKE.
    try {
      const ftsRows = await db.query<{ rowid: number }>('SELECT rowid FROM pattern_search WHERE pattern_search MATCH ? LIMIT 1000', [q]);
      if (ftsRows.length > 0) {
        const rowids = ftsRows.map(r => r.rowid).join(',');
        where.push(`p.rowid IN (${rowids})`);
      } else {
        where.push(`(p.title LIKE ? OR p.description LIKE ? OR p.slug LIKE ?)`);
        const like = `%${q}%`;
        params.push(like, like, like);
      }
    } catch (e) {
      where.push(`(p.title LIKE ? OR p.description LIKE ? OR p.slug LIKE ? OR p.id IN (
        SELECT pt.pattern_id FROM pattern_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE t.name LIKE ? OR t.slug LIKE ?
      ))`);
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }
  }

  if (difficulty) {
    const diffId = difficultyStringToId(difficulty);
    where.push('p.difficulty_id = ?');
    params.push(diffId);
  }

  if (tag) {
    where.push(`EXISTS (
      SELECT 1 FROM pattern_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.pattern_id = p.id AND (t.slug = ? OR t.name = ?)
    )`);
    params.push(tag, tag);
  }

  let orderBy = 'p.created_at DESC';
  if (sort === 'popular' || sort === 'views') {
    orderBy = 'COALESCE(a.views, 0) DESC, p.created_at DESC';
  } else if (sort === 'likes') {
    orderBy = 'COALESCE(a.likes, 0) DESC, p.created_at DESC';
  }

  const countSql = `SELECT COUNT(*) as count FROM patterns p` +
    (where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '');

  const dataSql = `SELECT
    p.id, p.slug, p.title, p.description, p.cover_image, p.difficulty,
    p.grid_size, p.color_palette, p.color_count, p.estimated_beads,
    p.created_at, p.updated_at,
    COALESCE(a.views, 0) as views,
    COALESCE(a.likes, 0) as likes,
    COALESCE(a.downloads, 0) as downloads
   FROM patterns p
   LEFT JOIN analytics a ON a.pattern_id = p.id
   WHERE ${where.join(' AND ')}
   ORDER BY ${orderBy}
   LIMIT ? OFFSET ?`;

  params.push(limit, offset);

  const countRow = await db.queryOne<{ count: number }>(countSql, params.slice(0, -2));
  const total = countRow?.count ?? 0;

  const patterns = await db.query<
    { id: string; slug: string; title: string; description: string | null; cover_image: string | null; difficulty: string; grid_size: string | null; created_at: string; updated_at: string; views: number; likes: number }
  >(dataSql, params);

  const tags = q ? await db.query<
    { id: string; slug: string; name: string; type: string }
  >(
    `SELECT id, slug, name, type FROM tags WHERE name LIKE ? OR slug LIKE ? LIMIT 20`,
    [`%${q}%`, `%${q}%`]
  ) : [];

  return c.json(success({
    query: q,
    filters: { difficulty, tag, sort },
    patterns: paginated(patterns, { page, limit, total }),
    tags,
  }));
});

export default search;
