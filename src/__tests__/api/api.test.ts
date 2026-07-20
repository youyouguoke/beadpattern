import { describe, it, expect } from '@jest/globals';

const BASE_URL = process.env.TEST_API_URL || 'https://api.beadpatternai.com/api';
const ADMIN_BASE_URL = process.env.TEST_ADMIN_API_URL || 'https://api.beadpatternai.com/api/admin';
const FRONTEND_URL = process.env.TEST_FRONTEND_URL || 'https://beadpatternai.com';
const ADMIN_TOKEN = process.env.TEST_ADMIN_API_TOKEN || process.env.NEXT_PUBLIC_ADMIN_API_TOKEN || '';

async function fetchJson(url: string, options?: RequestInit) {
  const res = await globalThis.fetch(url, {
    method: options?.method ?? 'GET',
    body: options?.body,
    headers: {
      'Cache-Control': 'no-cache',
      ...(options?.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    // ignore parse error
  }
  return { res, text, data };
}

function adminHeaders(contentType = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (ADMIN_TOKEN) headers.Authorization = `Bearer ${ADMIN_TOKEN}`;
  if (contentType) headers['Content-Type'] = 'application/json';
  return headers;
}

function hasAdminToken() {
  return Boolean(ADMIN_TOKEN);
}

describe('Public API', () => {
  it('pattern detail returns new fields', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/patterns/cute-panda`);
    expect(res.status).toBe(200);
    expect(data).not.toBeNull();
    const result = (data?.data as Record<string, unknown> || {});
    const pattern = (result.pattern as Record<string, unknown>) || result;
    expect(pattern.slug).toBe('cute-panda');
    expect(pattern.grid_size).toBeTruthy();
    expect(pattern.estimated_beads).toBeGreaterThan(0);
    expect(pattern.color_count).toBeGreaterThan(0);
    expect(pattern.color_palette).toBeInstanceOf(Array);
  });

  it('pattern detail returns steps and faq', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/patterns/cute-panda`);
    expect(res.status).toBe(200);
    const result = (data?.data as Record<string, unknown> || {});
    const steps = Array.isArray(result.steps) ? result.steps : [];
    const faqs = Array.isArray(result.faqs) ? result.faqs : [];
    expect(steps.length).toBeGreaterThan(0);
    expect(faqs.length).toBeGreaterThan(0);
  });

  it('recommend returns patterns with bead data', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/recommend/cute-panda`);
    expect(res.status).toBe(200);
    const list = (data?.data as Record<string, unknown>[] || []);
    expect(list.length).toBeGreaterThan(0);
    const first = list[0] as Record<string, unknown>;
    expect(first.grid_size).toBeTruthy();
    expect(first.estimated_beads).toBeGreaterThan(0);
    expect(first.color_count).toBeGreaterThan(0);
  });

  it('collection detail returns patterns', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/collections/cute-animals`);
    expect(res.status).toBe(200);
    const result = (data?.data as Record<string, unknown> || {});
    const patterns = (result.patterns as unknown[]) || [];
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('search returns results', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/search?q=cat`);
    expect(res.status).toBe(200);
    const result = (data?.data as Record<string, unknown> || {});
    const patternsResponse = result.patterns as Record<string, unknown> | undefined;
    const patterns = Array.isArray(patternsResponse?.data)
      ? patternsResponse.data
      : Array.isArray(result.patterns)
      ? result.patterns
      : [];
    expect(patterns.length).toBeGreaterThan(0);
    expect(result.query).toBe('cat');
  });

  it('download png returns url', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/patterns/cute-panda/download/png`);
    expect(res.status).toBe(200);
    const result = (data?.data as Record<string, unknown> || {});
    expect(result.url).toBeTruthy();
    expect(result.filename).toBeTruthy();
  });

  it('download pdf returns url', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/patterns/cute-panda/download/pdf`);
    expect(res.status).toBe(200);
    const result = (data?.data as Record<string, unknown> || {});
    expect(result.url).toBeTruthy();
    expect(result.filename).toBeTruthy();
  });

  it('categories list works', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/categories`);
    expect(res.status).toBe(200);
    const list = (data?.data as unknown[]) || [];
    expect(list.length).toBeGreaterThan(0);
  });

  it('collections list works', async () => {
    const { res, data } = await fetchJson(`${BASE_URL}/collections`);
    expect(res.status).toBe(200);
    const list = (data?.data as unknown[]) || [];
    expect(list.length).toBeGreaterThan(0);
  });
});

describe('Admin API', () => {
  it('auth ping succeeds with token', async () => {
    if (!hasAdminToken()) {
      console.warn('Skipping admin auth test: no TEST_ADMIN_API_TOKEN');
      return;
    }
    const { res, data } = await fetchJson(`${ADMIN_BASE_URL}/auth`, {
      headers: adminHeaders(),
    });
    expect(res.status).toBe(200);
    expect(data?.success).toBe(true);
    expect((data?.data as Record<string, unknown>)?.authenticated).toBe(true);
  });

  it('dashboard stats returns data', async () => {
    if (!hasAdminToken()) return;
    const { res, data } = await fetchJson(`${ADMIN_BASE_URL}/dashboard`, {
      headers: adminHeaders(),
    });
    expect(res.status).toBe(200);
    expect(data?.success).toBe(true);
    const stats = (data?.data as Record<string, unknown>) || {};
    expect(typeof stats).toBe('object');
  });

  it('patterns list paginates', async () => {
    if (!hasAdminToken()) return;
    const { res, data } = await fetchJson(`${ADMIN_BASE_URL}/patterns?limit=1`, {
      headers: adminHeaders(),
    });
    expect(res.status).toBe(200);
    expect(data?.success).toBe(true);
    expect(Array.isArray(data?.data)).toBe(true);
  });

  it('settings read/update works', async () => {
    if (!hasAdminToken()) return;

    const { res: getRes, data: getData } = await fetchJson(`${ADMIN_BASE_URL}/settings`, {
      headers: adminHeaders(),
    });
    expect(getRes.status).toBe(200);
    const before = (getData?.data as Record<string, unknown>) || {};

    const testValue = `test-${Date.now()}`;
    const { res: putRes, data: putData } = await fetchJson(`${ADMIN_BASE_URL}/settings`, {
      method: 'PUT',
      headers: adminHeaders(true),
      body: JSON.stringify({ values: { site_name: testValue } }),
    });
    expect(putRes.status).toBe(200);
    const after = (putData?.data as Record<string, unknown>) || {};
    expect(after.site_name).toBe(testValue);

    if (before.site_name !== undefined) {
      await fetchJson(`${ADMIN_BASE_URL}/settings`, {
        method: 'PUT',
        headers: adminHeaders(true),
        body: JSON.stringify({ values: { site_name: before.site_name as string } }),
      });
    }
  });

  it('redirects CRUD works', async () => {
    if (!hasAdminToken()) return;

    const oldPath = `/test-old-${Date.now()}`;
    const newPath = '/test-new';

    const { res: createRes, data: createData } = await fetchJson(`${ADMIN_BASE_URL}/seo/redirects`, {
      method: 'POST',
      headers: adminHeaders(true),
      body: JSON.stringify({ old_path: oldPath, new_path: newPath, code: 301 }),
    });
    expect(createRes.status).toBe(201);
    const created = (createData?.data as Record<string, unknown>) || {};
    const id = created.id as string;
    expect(id).toBeTruthy();
    expect(created.old_path).toBe(oldPath);
    expect(created.new_path).toBe(newPath);
    expect(created.code).toBe(301);

    const { res: listRes, data: listData } = await fetchJson(`${ADMIN_BASE_URL}/seo/redirects`, {
      headers: adminHeaders(),
    });
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listData?.data)).toBe(true);

    const updatedPath = `/test-updated-${Date.now()}`;
    const { res: updateRes, data: updateData } = await fetchJson(`${ADMIN_BASE_URL}/seo/redirects/${id}`, {
      method: 'PUT',
      headers: adminHeaders(true),
      body: JSON.stringify({ old_path: updatedPath }),
    });
    expect(updateRes.status).toBe(200);
    const updated = (updateData?.data as Record<string, unknown>) || {};
    expect(updated.old_path).toBe(updatedPath);

    const { res: deleteRes, data: deleteData } = await fetchJson(`${ADMIN_BASE_URL}/seo/redirects/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
    expect(deleteRes.status).toBe(200);
    expect((deleteData?.data as Record<string, unknown>)?.deleted).toBe(true);
  });

  it('sitemap metadata endpoints work', async () => {
    if (!hasAdminToken()) return;
    const { res: sitemapRes, data: sitemapData } = await fetchJson(`${ADMIN_BASE_URL}/seo/sitemap`, {
      headers: adminHeaders(),
    });
    expect(sitemapRes.status).toBe(200);
    const sitemap = (sitemapData?.data as Record<string, unknown>) || {};
    expect(typeof sitemap.patterns).toBe('number');

    const { res: metaRes, data: metaData } = await fetchJson(`${ADMIN_BASE_URL}/seo/metadata`, {
      headers: adminHeaders(),
    });
    expect(metaRes.status).toBe(200);
    const meta = (metaData?.data as Record<string, unknown>) || {};
    expect(typeof meta.pattern_template).toBe('string');
  });
});

// These page-level SSR checks are soft assertions: streaming SSR may return
// a loading shell instead of final rendered content. We verify 200/404 status
// and a safe fallback to rendered headings when hydration completes.

describe('Frontend Pages (soft SSR + DOM smoke)', () => {
  it('pattern detail page loads successfully', async () => {
    const { res, text } = await fetchJson(`${FRONTEND_URL}/pattern/cute-panda?nocache=1`);
    expect(res.status).toBe(200);
    const hasFallback = text.includes('Loading pattern') || text.includes('Cute Panda');
    expect(hasFallback).toBe(true);
  });

  it('collection detail page loads successfully', async () => {
    const { res, text } = await fetchJson(`${FRONTEND_URL}/collection/cute-animals?nocache=1`);
    expect(res.status).toBe(200);
    const hasContent = text.includes('Cute Animals Collection') || text.includes('patterns');
    expect(hasContent).toBe(true);
  });

  it('home page ssr contains hero', async () => {
    const { res, text } = await fetchJson(`${FRONTEND_URL}/?nocache=1`);
    expect(res.status).toBe(200);
    expect(text).toContain('BeadPatternAI');
  });

  it('404 page works', async () => {
    const { res } = await fetchJson(`${FRONTEND_URL}/pattern/not-exists-12345?nocache=1`);
    expect(res.status).toBe(404);
  });
});
