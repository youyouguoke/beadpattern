import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { CreateMediaSchema, UpdateMediaSchema } from '../../lib/schemas';
import { generateId } from '../../lib/slug';
import type { Bindings } from '../../lib/env';
import type { Media } from '../../types';

const media = new Hono<{ Bindings: Bindings }>();

media.get('/', async (c) => {
  const db = getDB(c.env);
  const folder = c.req.query('folder');
  const type = c.req.query('type');
  const q = c.req.query('q');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];
  if (folder) {
    where.push('folder = ?');
    params.push(folder);
  }
  if (type) {
    where.push('type = ?');
    params.push(type);
  }
  if (q) {
    where.push('(r2_key LIKE ? OR url LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM media ${whereClause}`,
    params
  );
  const total = countRow?.count ?? 0;
  const rows = await db.query<Media>(
    `SELECT * FROM media ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return c.json(paginated(rows, { page, limit, total }));
});

media.post('/', zValidator('json', CreateMediaSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const id = generateId();
  await db.insert('media', {
    id,
    url: body.url,
    r2_key: body.r2_key ?? null,
    type: body.type ?? null,
    size: body.size ?? null,
    width: body.width ?? null,
    height: body.height ?? null,
    folder: body.folder ?? null,
    used_by: body.used_by ? JSON.stringify(body.used_by) : null,
    created_at: new Date().toISOString(),
  });
  const row = await db.queryOne<Media>('SELECT * FROM media WHERE id = ?', [id]);
  return c.json(success(row), 201);
});

media.get('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const row = await db.queryOne<Media>('SELECT * FROM media WHERE id = ?', [id]);
  if (!row) throw new AppError('Media not found', 'MEDIA_NOT_FOUND', 404);
  return c.json(success(row));
});

media.put('/:id', zValidator('json', UpdateMediaSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const existing = await db.queryOne<Media>('SELECT id FROM media WHERE id = ?', [id]);
  if (!existing) throw new AppError('Media not found', 'MEDIA_NOT_FOUND', 404);
  const updates: Record<string, unknown> = {};
  if (body.url !== undefined) updates.url = body.url;
  if (body.r2_key !== undefined) updates.r2_key = body.r2_key;
  if (body.type !== undefined) updates.type = body.type;
  if (body.size !== undefined) updates.size = body.size;
  if (body.width !== undefined) updates.width = body.width;
  if (body.height !== undefined) updates.height = body.height;
  if (body.folder !== undefined) updates.folder = body.folder;
  if (body.used_by !== undefined) updates.used_by = body.used_by ? JSON.stringify(body.used_by) : null;
  await db.update('media', updates, { id });
  const row = await db.queryOne<Media>('SELECT * FROM media WHERE id = ?', [id]);
  return c.json(success(row));
});

media.delete('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  await db.deleteWhere('media', { id });
  return c.json(success({ deleted: true }));
});

media.get('/folders', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ folder: string }>(
    "SELECT DISTINCT folder FROM media WHERE folder IS NOT NULL AND folder != '' ORDER BY folder"
  );
  return c.json(success(rows.map((r) => r.folder)));
});

export default media;
