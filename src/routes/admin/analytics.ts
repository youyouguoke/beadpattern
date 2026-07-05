import { Hono } from 'hono';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import type { Bindings } from '../../lib/env';

const analytics = new Hono<{ Bindings: Bindings }>();

analytics.get('/patterns', async (c) => {
  const db = getDB(c.env);
  const from = c.req.query('from');
  const to = c.req.query('to');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];
  // analytics.updated_at is closest to date range concept without daily table
  if (from) {
    where.push('a.updated_at >= ?');
    params.push(from);
  }
  if (to) {
    where.push('a.updated_at <= ?');
    params.push(to);
  }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM analytics a ${whereClause}`,
    params
  );
  const total = countRow?.count ?? 0;
  const rows = await db.query(
    `SELECT p.id, p.slug, p.title, p.status, a.views, a.likes, a.shares, a.downloads, a.updated_at
     FROM analytics a
     JOIN patterns p ON p.id = a.pattern_id
     ${whereClause}
     ORDER BY a.views DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return c.json(paginated(rows, { page, limit, total }));
});

analytics.get('/patterns/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const pattern = await db.queryOne<{ id: string; slug: string; title: string }>(
    'SELECT id, slug, title FROM patterns WHERE id = ?',
    [id]
  );
  if (!pattern) return c.json({ success: false, error: { code: 'PATTERN_NOT_FOUND', message: 'Pattern not found' } }, 404);
  const analytics = await db.queryOne(
    'SELECT * FROM analytics WHERE pattern_id = ?',
    [id]
  );
  return c.json(success({
    pattern,
    totals: analytics ?? { views: 0, likes: 0, shares: 0, downloads: 0 },
    last_7_days: [],
    last_30_days: [],
  }));
});

analytics.get('/search-keywords', async (c) => {
  return c.json(success([]));
});

export default analytics;
