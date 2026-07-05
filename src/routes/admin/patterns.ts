import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { AdminPatternQuerySchema, BulkPublishSchema, BulkArchiveSchema, BulkDeleteSchema, UpdateStatusSchema } from '../../lib/schemas';
import { computeHealthScore } from '../../lib/health';
import type { Bindings } from '../../lib/env';
import type { MinimalSeo, Pattern } from '../../types';

const patterns = new Hono<{ Bindings: Bindings }>();

async function getPatternHealthData(db: ReturnType<typeof getDB>, id: string) {
  const pattern = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
  if (!pattern) return null;
  const steps = await db.query<{ step_number: number }>('SELECT step_number FROM pattern_steps WHERE pattern_id = ?', [id]);
  const tags = await db.query<{ tag_id: string }>('SELECT tag_id FROM pattern_tags WHERE pattern_id = ?', [id]);
  const collections = await db.query<{ collection_id: string }>('SELECT collection_id FROM pattern_collections WHERE pattern_id = ?', [id]);
  const seo = await db.queryOne<MinimalSeo>('SELECT title, description FROM pattern_seo WHERE pattern_id = ?', [id]);
  const colors = await db.query<{ count: number }>('SELECT count FROM pattern_colors WHERE pattern_id = ?', [id]);
  return { pattern, steps, tags, collections, seo, colors };
}

async function healthForPattern(db: ReturnType<typeof getDB>, pattern: Pattern) {
  const data = await getPatternHealthData(db, pattern.id);
  if (!data) return { score: 0, checks: [] };
  return computeHealthScore(
    data.pattern,
    data.steps as { step_number: number }[],
    data.tags,
    data.collections as { collection_id: string }[],
    data.seo,
    data.colors
  );
}

patterns.get('/', zValidator('query', AdminPatternQuerySchema), async (c) => {
  const db = getDB(c.env);
  const query = c.req.valid('query');
  const { status, difficulty, collection, category, tag, q, sort, page, limit } = query;
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];

  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }
  if (difficulty) {
    const diff = typeof difficulty === 'string' ? difficulty : 'easy';
    const diffId = diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3;
    where.push('p.difficulty_id = ?');
    params.push(diffId);
  }
  if (collection) {
    where.push('EXISTS (SELECT 1 FROM pattern_collections pc JOIN collections col ON col.id = pc.collection_id WHERE pc.pattern_id = p.id AND (col.slug = ? OR col.id = ?))');
    params.push(collection, collection);
  }
  if (category) {
    where.push('EXISTS (SELECT 1 FROM pattern_categories pct JOIN categories cat ON cat.id = pct.category_id WHERE pct.pattern_id = p.id AND (cat.slug = ? OR cat.id = ?))');
    params.push(category, category);
  }
  if (tag) {
    where.push('EXISTS (SELECT 1 FROM pattern_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.pattern_id = p.id AND (t.slug = ? OR t.id = ?))');
    params.push(tag, tag);
  }
  if (q) {
    where.push('(p.title LIKE ? OR p.description LIKE ? OR p.slug LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const countSql = `SELECT COUNT(*) as count FROM patterns p ${whereClause}`;
  const countRow = await db.queryOne<{ count: number }>(countSql, params);
  const total = countRow?.count ?? 0;

  let orderBy = 'p.created_at DESC';
  if (sort === 'updated') orderBy = 'p.updated_at DESC';
  else if (sort === 'views') orderBy = 'COALESCE(a.views, 0) DESC';
  else if (sort === 'downloads') orderBy = 'COALESCE(a.downloads, 0) DESC';

  const dataSql = `SELECT p.*, COALESCE(a.views, 0) as views, COALESCE(a.likes, 0) as likes, COALESCE(a.downloads, 0) as downloads FROM patterns p LEFT JOIN analytics a ON a.pattern_id = p.id ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const rows = await db.query<Pattern & { views: number; likes: number; downloads: number }>(dataSql, [...params, limit, offset]);

  const items = await Promise.all(rows.map(async (r) => {
    const health = await healthForPattern(db, r);
    return { ...r, health };
  }));

  return c.json(paginated(items, { page, limit, total }));
});

patterns.put('/:id/status', zValidator('json', UpdateStatusSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const { status } = c.req.valid('json');
  const existing = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'published') {
    updates.published_at = new Date().toISOString();
    updates.version = await db.queryOne<{ version: number }>('SELECT version FROM patterns WHERE id = ?', [id]).then((r) => (r?.version ?? 0) + 1);
  }
  await db.update('patterns', updates, { id });
  return c.json(success({ id, status }));
});

patterns.post('/:id/publish', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<Pattern>('SELECT id, status FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const now = new Date().toISOString();
  await db.execute(
    'UPDATE patterns SET status = \'published\', version = version + 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?',
    [now, now, id]
  );
  return c.json(success({ id, status: 'published' }));
});

patterns.post('/:id/archive', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  await db.update('patterns', { status: 'archived', updated_at: new Date().toISOString() }, { id });
  return c.json(success({ id, status: 'archived' }));
});

patterns.post('/bulk-publish', zValidator('json', BulkPublishSchema), async (c) => {
  const db = getDB(c.env);
  const { ids, all, slugs } = c.req.valid('json');
  const now = new Date().toISOString();
  let sql = "UPDATE patterns SET status = 'published', version = version + 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE status = 'draft'";
  const params: unknown[] = [now, now];
  if (!all && ((ids && ids.length > 0) || (slugs && slugs.length > 0))) {
    const conditions: string[] = [];
    if (ids && ids.length > 0) {
      conditions.push('id IN (' + ids.map(() => '?').join(',') + ')');
      params.push(...ids);
    }
    if (slugs && slugs.length > 0) {
      conditions.push('slug IN (' + slugs.map(() => '?').join(',') + ')');
      params.push(...slugs);
    }
    sql += ' AND (' + conditions.join(' OR ') + ')';
  }
  const result = await db.execute(sql, params) as { meta?: { changes?: number } };
  return c.json(success({ published: result.meta?.changes ?? 0 }));
});

patterns.post('/bulk-archive', zValidator('json', BulkArchiveSchema), async (c) => {
  const db = getDB(c.env);
  const { ids, all, slugs } = c.req.valid('json');
  const now = new Date().toISOString();
  let sql = "UPDATE patterns SET status = 'archived', updated_at = ?";
  const params: unknown[] = [now];
  if (!all && ((ids && ids.length > 0) || (slugs && slugs.length > 0))) {
    const conditions: string[] = [];
    if (ids && ids.length > 0) {
      conditions.push('id IN (' + ids.map(() => '?').join(',') + ')');
      params.push(...ids);
    }
    if (slugs && slugs.length > 0) {
      conditions.push('slug IN (' + slugs.map(() => '?').join(',') + ')');
      params.push(...slugs);
    }
    sql += ' WHERE ' + conditions.join(' OR ');
  }
  const result = await db.execute(sql, params) as { meta?: { changes?: number } };
  return c.json(success({ archived: result.meta?.changes ?? 0 }));
});

patterns.delete('/bulk-delete', zValidator('json', BulkDeleteSchema), async (c) => {
  const db = getDB(c.env);
  const { ids } = c.req.valid('json');
  if (!ids || ids.length === 0) return c.json(success({ deleted: 0 }));
  const placeholders = ids.map(() => '?').join(',');
  const result = await db.execute(`DELETE FROM patterns WHERE id IN (${placeholders})`, ids) as { meta?: { changes?: number } };
  return c.json(success({ deleted: result.meta?.changes ?? 0 }));
});

patterns.get('/:id/health', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const data = await getPatternHealthData(db, id);
  if (!data) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const health = computeHealthScore(
    data.pattern,
    data.steps as { step_number: number }[],
    data.tags,
    data.collections as { collection_id: string }[],
    data.seo,
    data.colors
  );
  return c.json(success(health));
});

export default patterns;
