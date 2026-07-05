import { Hono } from 'hono';
import { getDB } from '../lib/db';
import { normalizeSlug, generateId } from '../lib/slug';
import { success } from '../lib/response';
import { AppError } from '../lib/errors';
import { BulkImportRowSchema } from '../lib/schemas';
import type { Bindings } from '../lib/env';
import type { ZodError } from 'zod';

const bulk = new Hono<{ Bindings: Bindings }>();

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] ?? ''));
    rows.push(row);
  }
  return rows;
}

function parseInput(body: { source_type: string; source_data: string }): Record<string, string>[] {
  if (body.source_type === 'json') {
    return JSON.parse(body.source_data);
  }
  return parseCSV(body.source_data);
}

bulk.post('/preview', async (c) => {
  const db = getDB(c.env);
  const body = await c.req.json<{ source_type: string; source_data: string }>();
  const rawRows = parseInput(body);

  const rows: { row: number; data: Record<string, unknown>; errors?: string[] }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const parsed = BulkImportRowSchema.safeParse(rawRows[i]);
    if (parsed.success) {
      const data = parsed.data;
      const slug = data.slug ?? normalizeSlug(data.title);
      const existing = await db.queryOne('SELECT id FROM patterns WHERE slug = ?', [slug]);
      rows.push({
        row: i + 1,
        data: {
          ...data,
          slug,
          status: 'draft',
        },
        errors: existing ? ['Pattern slug already exists'] : undefined,
      });
    } else {
      const zodErr = parsed.error as ZodError;
      rows.push({
        row: i + 1,
        data: rawRows[i],
        errors: zodErr.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
    }
  }

  return c.json(success({ total: rawRows.length, rows }));
});

bulk.post('/create', async (c) => {
  const db = getDB(c.env);
  const body = await c.req.json<{ source_type: string; source_data: string }>();
  const rawRows = parseInput(body);

  const jobId = generateId();
  await db.insert('bulk_jobs', {
    id: jobId,
    source_type: body.source_type,
    source_data: body.source_data,
    status: 'processing',
    total_rows: rawRows.length,
  });

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const parsed = BulkImportRowSchema.safeParse(rawRows[i]);
    if (!parsed.success) {
      failed++;
      errors.push(`Row ${i + 1}: invalid data`);
      continue;
    }

    const data = parsed.data;
    const slug = data.slug ?? normalizeSlug(data.title);
    const existing = await db.queryOne('SELECT id FROM patterns WHERE slug = ?', [slug]);
    if (existing) {
      failed++;
      errors.push(`Row ${i + 1}: duplicate slug ${slug}`);
      continue;
    }

    const id = generateId();
    const palette = data.color_palette
      ? data.color_palette.split(',').map((c) => c.trim())
      : undefined;

    await db.insert('patterns', {
      id,
      slug,
      title: data.title,
      description: data.description ?? null,
      difficulty: data.difficulty,
      status: 'draft',
      cover_image: data.cover_image ?? null,
      grid_size: data.grid_size ?? null,
      estimated_beads: data.estimated_beads ?? null,
      color_count: data.color_count ?? null,
      color_palette: palette ? JSON.stringify(palette) : null,
      seo_title: `${data.title} | BeadPatternAI`,
      seo_description: data.description ?? null,
      seo_keywords: null,
    });

    // Resolve tags
    const tagSlugs = (data.tags ?? data.tag_slugs ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (tagSlugs.length > 0) {
      const placeholders = tagSlugs.map(() => '?').join(',');
      const tags = await db.query<{ id: string }>(
        `SELECT id FROM tags WHERE slug IN (${placeholders})`,
        tagSlugs
      );
      for (const tag of tags) {
        await db.insert('pattern_tags', { pattern_id: id, tag_id: tag.id });
      }
    }

    await db.insert('analytics', { pattern_id: id });
    processed++;
  }

  await db.update(
    'bulk_jobs',
    {
      status: failed === 0 ? 'done' : 'failed',
      processed_rows: processed,
      failed_rows: failed,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
      updated_at: new Date().toISOString(),
    },
    { id: jobId }
  );

  return c.json(success({ jobId, total: rawRows.length, processed, failed, errors }));
});

bulk.post('/publish', async (c) => {
  const db = getDB(c.env);
  const body = await c.req.json<{ slugs?: string[]; all?: boolean }>();
  const { slugs, all } = body;

  let sql = `UPDATE patterns SET
    status = 'published',
    version = version + 1,
    published_at = COALESCE(published_at, ?),
    updated_at = ?
  WHERE status = 'draft'`;
  const now = new Date().toISOString();
  const params: unknown[] = [now, now];

  if (!all && slugs && slugs.length > 0) {
    const placeholders = slugs.map(() => '?').join(',');
    sql += ` AND slug IN (${placeholders})`;
    params.push(...slugs);
  }

  const result = await db.execute(sql, params) as { meta?: { changes?: number } };
  const updated = result.meta?.changes ?? 0;

  return c.json(success({ published: updated }));
});

bulk.get('/jobs/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const job = await db.queryOne('SELECT * FROM bulk_jobs WHERE id = ?', [id]);
  if (!job) throw new AppError('Job not found', 'JOB_NOT_FOUND', 404);
  return c.json(success(job));
});

export default bulk;
