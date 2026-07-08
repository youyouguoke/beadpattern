import { Hono } from 'hono';
import { getDB } from '../lib/db';
import { success } from '../lib/response';
import type { Bindings } from '../lib/env';

const sitemap = new Hono<{ Bindings: Bindings }>();

sitemap.get('/patterns', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM patterns WHERE status = 'published' ORDER BY updated_at DESC"
  );
  return c.json(success(rows));
});

sitemap.get('/tags', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ slug: string }>('SELECT slug FROM tags ORDER BY slug');
  return c.json(success(rows));
});

sitemap.get('/difficulty', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ slug: string }>('SELECT slug FROM difficulties ORDER BY display_order');
  return c.json(success(rows));
});

sitemap.get('/', async (c) => {
  const db = getDB(c.env);
  const baseUrl = c.env.SITE_URL ?? 'https://beadpatternai.com';
  const patterns = await db.query<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM patterns WHERE status = 'published' ORDER BY updated_at DESC"
  );
  const collections = await db.query<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM collections WHERE published = 1"
  );
  const categories = await db.query<{ slug: string; updated_at: string }>('SELECT slug, updated_at FROM categories');
  const tags = await db.query<{ slug: string }>('SELECT slug FROM tags');

  const urls = [
    { loc: baseUrl, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/patterns`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/categories`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/collections`, lastmod: new Date().toISOString() },
    ...patterns.map((p) => ({ loc: `${baseUrl}/pattern/${p.slug}`, lastmod: p.updated_at })),
    ...collections.map((c) => ({ loc: `${baseUrl}/collection/${c.slug}`, lastmod: c.updated_at })),
    ...categories.map((c) => ({ loc: `${baseUrl}/category/${c.slug}`, lastmod: c.updated_at })),
    ...tags.map((t) => ({ loc: `${baseUrl}/tag/${t.slug}`, lastmod: new Date().toISOString() })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n')}\n</urlset>`;

  c.header('Content-Type', 'application/xml');
  return c.body(xml);
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default sitemap;
