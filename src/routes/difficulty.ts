import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../lib/db';
import { success, paginated } from '../lib/response';
import { difficultyStringToId } from '../lib/schemas';
import type { Bindings } from '../lib/env';

const difficulty = new Hono<{ Bindings: Bindings }>();

difficulty.get('/:level', zValidator('param', z.object({ level: z.enum(['easy', 'medium', 'hard']) })), async (c) => {
  const db = getDB(c.env);
  const { level } = c.req.valid('param');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;
  const difficultyId = difficultyStringToId(level);

  const countRow = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM patterns WHERE status = ? AND difficulty_id = ?',
    ['published', difficultyId]
  );
  const total = countRow?.count ?? 0;

  const patterns = await db.query<
    { id: string; slug: string; title: string; cover_image: string | null; difficulty: string; created_at: string }
  >(
    `SELECT p.id, p.slug, p.title, p.cover_image, p.difficulty, p.created_at, d.slug as difficulty_slug
     FROM patterns p
     JOIN difficulties d ON d.id = p.difficulty_id
     WHERE p.status = 'published' AND p.difficulty_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [difficultyId, limit, offset]
  );

  return c.json(success({
    difficulty: level,
    patterns: paginated(patterns, { page, limit, total }),
  }));
});

export default difficulty;
