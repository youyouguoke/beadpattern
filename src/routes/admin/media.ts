import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { CreateMediaSchema, UpdateMediaSchema } from '../../lib/schemas';
import { generateId } from '../../lib/slug';
import { parseUsedBy, getTotalUsedBy } from '../../lib/media';
import { parseImageSize } from '../../lib/imageSize';
import type { Bindings } from '../../lib/env';
import type { Media } from '../../types';

const media = new Hono<{ Bindings: Bindings }>();

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function folderFromType(type: string | undefined): string {
  switch (type) {
    case 'cover':
      return 'covers';
    case 'finished':
      return 'finished';
    case 'step':
      return 'steps';
    case 'gallery':
      return 'gallery';
    case 'banner':
      return 'banners';
    default:
      return 'uploads';
  }
}

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
  const items = rows.map((r) => ({
    ...r,
    used_by: parseUsedBy(r.used_by),
    used_by_total: getTotalUsedBy(parseUsedBy(r.used_by)),
  }));
  return c.json(paginated(items, { page, limit, total }));
});

media.get('/folders', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ folder: string }>(
    "SELECT DISTINCT folder FROM media WHERE folder IS NOT NULL AND folder != '' ORDER BY folder"
  );
  return c.json(success(rows.map((r) => r.folder)));
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
    alt_text: body.alt_text ?? null,
    created_at: new Date().toISOString(),
  });
  const row = await db.queryOne<Media>('SELECT * FROM media WHERE id = ?', [id]);
  if (!row) throw new AppError('Media creation failed', 'MEDIA_CREATE_FAILED', 500);
  return c.json(success({ ...row, used_by: parseUsedBy(row.used_by), used_by_total: getTotalUsedBy(parseUsedBy(row.used_by)) }), 201);
});

media.get('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const row = await db.queryOne<Media>('SELECT * FROM media WHERE id = ?', [id]);
  if (!row) throw new AppError('Media not found', 'MEDIA_NOT_FOUND', 404);
  return c.json(success({ ...row, used_by: parseUsedBy(row.used_by), used_by_total: getTotalUsedBy(parseUsedBy(row.used_by)) }));
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
  if (body.alt_text !== undefined) updates.alt_text = body.alt_text;
  if (body.used_by !== undefined) updates.used_by = body.used_by ? JSON.stringify(body.used_by) : null;
  await db.update('media', updates, { id });
  const row = await db.queryOne<Media>('SELECT * FROM media WHERE id = ?', [id]);
  if (!row) throw new AppError('Media not found', 'MEDIA_NOT_FOUND', 404);
  return c.json(success({ ...row, used_by: parseUsedBy(row.used_by), used_by_total: getTotalUsedBy(parseUsedBy(row.used_by)) }));
});

media.delete('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const row = await db.queryOne<Media>('SELECT r2_key, used_by FROM media WHERE id = ?', [id]);
  if (!row) throw new AppError('Media not found', 'MEDIA_NOT_FOUND', 404);
  const usedBy = parseUsedBy(row.used_by);
  const total = getTotalUsedBy(usedBy);
  if (total > 0) {
    throw new AppError(`Media is referenced by ${total} pattern resource(s). Remove references before deleting.`, 'MEDIA_IN_USE', 409);
  }
  if (row.r2_key && c.env.R2) {
    await c.env.R2.delete(row.r2_key);
  }
  await db.deleteWhere('media', { id });
  return c.json(success({ deleted: true }));
});

media.post('/upload-image', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  const typeRaw = body.type;

  if (!file || !(file instanceof File)) {
    throw new AppError('No file uploaded', 'FILE_MISSING', 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError('Invalid file type. Only PNG, JPEG, WebP, GIF are allowed.', 'FILE_INVALID', 400);
  }

  if (!c.env.R2) {
    throw new AppError('R2 storage is not configured', 'R2_NOT_CONFIGURED', 503);
  }

  if (file.size > MAX_SIZE) {
    throw new AppError('File too large. Max 5MB.', 'FILE_TOO_LARGE', 400);
  }

  const type = typeof typeRaw === 'string' && ['cover', 'finished', 'step', 'gallery', 'banner'].includes(typeRaw)
    ? typeRaw
    : undefined;
  const folder = c.req.query('folder') ?? folderFromType(type);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png';
  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${generateId()}.${safeExt}`;

  const fileBuffer = await file.arrayBuffer();
  await c.env.R2.put(key, fileBuffer, {
    httpMetadata: { contentType: file.type },
  });

  const size = parseImageSize(fileBuffer, file.type) ?? { width: null, height: null };
  const altText = typeof body.alt_text === 'string' ? body.alt_text : null;

  const url = c.env.R2_PUBLIC_URL
    ? `${c.env.R2_PUBLIC_URL}/${key}`
    : `/media/${key}`;

  const db = getDB(c.env);
  const id = generateId();
  await db.insert('media', {
    id,
    r2_key: key,
    url,
    type: type ?? null,
    size: file.size,
    width: size.width,
    height: size.height,
    folder,
    used_by: null,
    alt_text: altText,
    created_at: new Date().toISOString(),
  });

  const row = await db.queryOne<Media>('SELECT * FROM media WHERE id = ?', [id]);
  if (!row) throw new AppError('Media creation failed', 'MEDIA_CREATE_FAILED', 500);
  return c.json(success({ ...row, used_by: parseUsedBy(row.used_by), used_by_total: getTotalUsedBy(parseUsedBy(row.used_by)) }), 201);
});

export default media;
