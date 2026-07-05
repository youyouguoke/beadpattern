import { Hono } from 'hono';
import { getDB } from '../../lib/db';
import { success } from '../../lib/response';
import { computeHealthScore } from '../../lib/health';
import type { Bindings } from '../../lib/env';
import type { MinimalSeo, Pattern } from '../../types';

const dashboard = new Hono<{ Bindings: Bindings }>();

async function healthDistribution(db: ReturnType<typeof getDB>) {
  const patterns = await db.query<Pattern>('SELECT * FROM patterns');
  const buckets = { below60: 0, between60and80: 0, above80: 0 };
  for (const p of patterns) {
    const steps = await db.query<{ step_number: number }>('SELECT step_number FROM pattern_steps WHERE pattern_id = ?', [p.id]);
    const tags = await db.query<{ tag_id: string }>('SELECT tag_id FROM pattern_tags WHERE pattern_id = ?', [p.id]);
    const collections = await db.query<{ collection_id: string }>('SELECT collection_id FROM pattern_collections WHERE pattern_id = ?', [p.id]);
    const seo = await db.queryOne<MinimalSeo>('SELECT title, description FROM pattern_seo WHERE pattern_id = ?', [p.id]);
    const colors = await db.query<{ count: number }>('SELECT count FROM pattern_colors WHERE pattern_id = ?', [p.id]);
    const { score } = computeHealthScore(p, steps as { step_number: number }[], tags, collections as { collection_id: string }[], seo, colors);
    if (score < 60) buckets.below60++;
    else if (score <= 80) buckets.between60and80++;
    else buckets.above80++;
  }
  return buckets;
}

dashboard.get('/', async (c) => {
  const db = getDB(c.env);

  const patterns = await db.queryOne<{ total: number; published: number; draft: number; archived: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
       SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
       SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
     FROM patterns`
  );

  const collections = await db.queryOne<{ total: number; published: number }>(
    `SELECT COUNT(*) as total, SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) as published FROM collections`
  );

  const tags = await db.queryOne<{ total: number }>('SELECT COUNT(*) as total FROM tags');
  const media = await db.queryOne<{ total: number }>('SELECT COUNT(*) as total FROM media');
  const bulkJobs = await db.queryOne<{ total: number; pending: number; processing: number; done: number; failed: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
     FROM bulk_jobs`
  );

  const latestPatterns = await db.query<Pattern>(
    `SELECT id, slug, title, status, cover_image, created_at, updated_at
     FROM patterns
     ORDER BY created_at DESC
     LIMIT 10`
  );

  const latestBulkJobs = await db.query(
    'SELECT id, status, total_rows, processed_rows, failed_rows, created_at, updated_at FROM bulk_jobs ORDER BY created_at DESC LIMIT 5'
  );

  const topDownloaded = await db.query(
    `SELECT p.id, p.slug, p.title, a.downloads
     FROM patterns p
     JOIN analytics a ON a.pattern_id = p.id
     ORDER BY a.downloads DESC
     LIMIT 10`
  );

  const recentlyUpdated = await db.query<Pattern>(
    `SELECT id, slug, title, status, updated_at
     FROM patterns
     ORDER BY updated_at DESC
     LIMIT 10`
  );

  const contentHealth = await healthDistribution(db);

  return c.json(success({
    patterns: patterns ?? { total: 0, published: 0, draft: 0, archived: 0 },
    collections: collections ?? { total: 0, published: 0 },
    tags: tags ?? { total: 0 },
    media: media ?? { total: 0 },
    bulk_jobs: bulkJobs ?? { total: 0, pending: 0, processing: 0, done: 0, failed: 0 },
    latest_patterns: latestPatterns,
    latest_bulk_jobs: latestBulkJobs,
    top_downloaded: topDownloaded,
    recently_updated: recentlyUpdated,
    content_health: contentHealth,
  }));
});

export default dashboard;
