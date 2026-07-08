import { Hono } from 'hono';
import { getDB } from '../../lib/db';
import { success } from '../../lib/response';
import type { Bindings } from '../../lib/env';

interface DashboardPatternRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  emoji?: string;
  description?: string;
  difficulty?: string;
  grid_size?: string;
  estimated_beads?: number;
  color_count?: number;
  finished_image?: string | null;
  seo_title?: string;
  seo_description?: string;
  views?: number;
  likes?: number;
  downloads?: number;
}

interface BulkJobRow {
  id: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  created_at: string;
  updated_at?: string;
  name?: string;
}

interface TopDownloadedRow {
  id: string;
  slug: string;
  title: string;
  downloads: number;
}

const dashboard = new Hono<{ Bindings: Bindings }>();

function toAdminPattern(p: DashboardPatternRow) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    emoji: p.emoji ?? '',
    description: p.description ?? '',
    difficulty: p.difficulty ?? 'easy',
    grid: p.grid_size ?? '24x24',
    beadCount: p.estimated_beads ?? 0,
    colors: p.color_count ?? 0,
    status: p.status,
    coverImage: p.cover_image ?? '',
    finishedImage: p.finished_image ?? '',
    tags: [],
    categories: [],
    collections: [],
    steps: [],
    seoTitle: p.seo_title ?? '',
    seoDescription: p.seo_description ?? '',
    keywords: [],
    views: p.views ?? 0,
    downloads: p.downloads ?? 0,
    likes: p.likes ?? 0,
    createdAt: p.created_at ?? '',
    updatedAt: p.updated_at ?? '',
    healthScore: 0,
    healthChecks: [],
  };
}

function toAdminBulkJob(j: BulkJobRow) {
  return {
    id: j.id,
    name: j.name ?? 'Bulk Job',
    status: j.status as 'pending' | 'running' | 'completed' | 'failed',
    total: j.total_rows ?? 0,
    processed: j.processed_rows ?? 0,
    errors: j.failed_rows ?? 0,
    warnings: 0,
    createdAt: j.created_at ?? '',
    completedAt: j.updated_at,
  };
}

dashboard.get('/', async (c) => {
  const db = getDB(c.env);

  const patterns = await db.queryOne<{ total: number; published: number; draft: number; archived: number }>(
    `SELECT
       COUNT(*) as total,
       COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) as published,
       COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) as draft,
       COALESCE(SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END), 0) as archived
     FROM patterns`
  );

  const collections = await db.queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM collections`
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

  const latestPatterns = await db.query<DashboardPatternRow>(
    `SELECT p.id, p.slug, p.title, p.status, p.description, p.difficulty, p.grid_size, p.estimated_beads, p.color_count, p.cover_image, p.finished_image, p.seo_title, p.seo_description, COALESCE(a.views, 0) AS views, COALESCE(a.likes, 0) AS likes, COALESCE(a.downloads, 0) AS downloads, p.created_at, p.updated_at
     FROM patterns p
     LEFT JOIN analytics a ON a.pattern_id = p.id
     ORDER BY p.created_at DESC
     LIMIT 10`
  );

  const latestBulkJobs = await db.query<BulkJobRow>(
    'SELECT id, status, total_rows, processed_rows, failed_rows, created_at, updated_at FROM bulk_jobs ORDER BY created_at DESC LIMIT 5'
  );

  const topDownloaded = await db.query<TopDownloadedRow>(
    `SELECT p.id, p.slug, p.title, COALESCE(a.downloads, 0) AS downloads
     FROM patterns p
     LEFT JOIN analytics a ON a.pattern_id = p.id
     ORDER BY a.downloads DESC
     LIMIT 10`
  );

  return c.json(success({
    patterns: patterns ?? { total: 0, published: 0, draft: 0, archived: 0 },
    collections: (collections?.total ?? 0),
    tags: (tags?.total ?? 0),
    media: (media?.total ?? 0),
    bulkJobs: (bulkJobs?.total ?? 0),
    latestPatterns: latestPatterns.map(toAdminPattern),
    latestJobs: latestBulkJobs.map(toAdminBulkJob),
    topDownloaded: topDownloaded.map((p) => ({
      title: p.title ?? '',
      slug: p.slug ?? '',
      downloads: p.downloads ?? 0,
    })),
    recentlyUpdated: latestPatterns.map(toAdminPattern),
    searchTrends: [],
    googleIndex: { indexed: 0, submitted: 0, pending: 0 },
  }));
});

export default dashboard;
