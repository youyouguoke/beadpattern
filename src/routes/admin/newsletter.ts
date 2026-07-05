import { Hono } from 'hono';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import type { Bindings } from '../../lib/env';
import type { NewsletterSubscriber } from '../../types';

const newsletter = new Hono<{ Bindings: Bindings }>();

newsletter.get('/subscribers', async (c) => {
  const db = getDB(c.env);
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;
  const source = c.req.query('source');
  const where: string[] = [];
  const params: unknown[] = [];
  if (source) {
    where.push('source = ?');
    params.push(source);
  }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM newsletter_subscribers ${whereClause}`,
    params
  );
  const total = countRow?.count ?? 0;
  const rows = await db.query<NewsletterSubscriber>(
    `SELECT * FROM newsletter_subscribers ${whereClause} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return c.json(paginated(rows, { page, limit, total }));
});

newsletter.post('/subscribers/export', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ email: string; source: string | null; subscribed_at: string | null }>(
    'SELECT email, source, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC'
  );
  const header = 'email,source,subscribed_at';
  const lines = rows.map((r) => `${r.email},${r.source ?? ''},${r.subscribed_at ?? ''}`);
  const csv = [header, ...lines].join('\n');
  return c.json(success({ csv }));
});

newsletter.delete('/subscribers/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<{ id: string }>('SELECT id FROM newsletter_subscribers WHERE id = ?', [id]);
  if (!existing) throw new AppError('Subscriber not found', 'SUBSCRIBER_NOT_FOUND', 404);
  await db.deleteWhere('newsletter_subscribers', { id });
  return c.json(success({ deleted: true }));
});

export default newsletter;
