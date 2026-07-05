import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../lib/db';
import { success, paginated } from '../lib/response';
import type { Bindings } from '../lib/env';

const difficulty = new Hono<{ Bindings: Bindings }>();

difficulty.get('/:level', zValidator('param', z.object({ level: z.enum(['easy', 'medium', 'hard']) })), async (c) => {
  const db = getDB(c.env);
  const { level } = c.req.valid('param');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;

  const countRow = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM patterns WHERE status = ? AND difficulty = ?',
    ['published', level]
  );
  const total = countRow?.count ?? 0;

  const patterns = await db.query<
    { id: string; slug: string; title: string; cover_image: string | null; difficulty: string; created_at: string }
  >(
    `SELECT id, slug, title, cover_image, difficulty, created_at
     FROM patterns
     WHERE status = 'published' AND difficulty = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [level, limit, offset]
  );

  return c.json(success({
    difficulty: level,
    patterns: paginated(patterns, { page, limit, total }),
  }));
});

export default difficulty;
