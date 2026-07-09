#!/usr/bin/env ts-node
// API Smoke Test (Node/TypeScript version)
// Usage: TEST_ADMIN_API_TOKEN=*** npx ts-node scripts/api-smoke-test.ts

interface TestResult {
  pass: number;
  fail: number;
}

const API_URL = process.env.TEST_API_URL || 'https://api.beadpatternai.com/api';
const ADMIN_URL = process.env.TEST_ADMIN_API_URL || 'https://api.beadpatternai.com/api/admin';
const FRONTEND_URL = process.env.TEST_FRONTEND_URL || 'https://beadpatternai.com';
const TOKEN = process.env.TEST_ADMIN_API_TOKEN || process.env.NEXT_PUBLIC_ADMIN_API_TOKEN || '';
// Load .env.production / .env.local if present (Node runtime)
function loadEnvFile(file: string) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(file)) return;
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const match = line.match(/^NEXT_PUBLIC_ADMIN_API_TOKEN=(.+)$/);
      if (match && !process.env.NEXT_PUBLIC_ADMIN_API_TOKEN) {
        process.env.NEXT_PUBLIC_ADMIN_API_TOKEN = match[1].trim();
      }
    }
  } catch {
    /* ignore */
  }
}
loadEnvFile('.env.production');
loadEnvFile('.env.local');


const result: TestResult = { pass: 0, fail: 0 };

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
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
    // ignore
  }
  return { res, text, data };
}

function pass(label: string) {
  result.pass++;
  console.log(`✅ PASS: ${label}`);
}

function fail(label: string, detail?: string) {
  result.fail++;
  console.log(`❌ FAIL: ${label}${detail ? ` (${detail})` : ''}`);
}

async function publicSmoke() {
  console.log('== Public API ==');
  const endpoints = [
    ['/patterns/cute-panda'],
    ['/recommend/cute-panda'],
    ['/collections/cute-animals'],
    ['/search?q=cat'],
    ['/categories'],
    ['/collections'],
    ['/patterns/cute-panda/download/png'],
    ['/patterns/cute-panda/download/pdf'],
  ];
  for (const [path] of endpoints) {
    const { res } = await fetchJson(`${API_URL}${path}`);
    if (res.status === 200) pass(`GET ${API_URL}${path}`);
    else fail(`GET ${API_URL}${path}`, `status ${res.status}`);
  }
}

async function frontendSmoke() {
  console.log('== Frontend SSR ==');
  const { res, text } = await fetchJson(`${FRONTEND_URL}/pattern/cute-panda?nocache=1`);
  if (res.status === 200 && text.includes('Related Patterns')) {
    pass('Frontend pattern page contains Related Patterns');
  } else {
    fail('Frontend pattern page', `status ${res.status}`);
  }
}

async function adminSmoke() {
  if (!TOKEN) {
    console.log('⚠️  TEST_ADMIN_API_TOKEN not set, skipping admin API tests');
    return;
  }

  console.log('== Admin API ==');
  const headers = { Authorization: `Bearer ${TOKEN}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const auth = await fetchJson(`${ADMIN_URL}/auth`, { headers });
  if (auth.res.status === 200) pass('GET /admin/auth');
  else fail('GET /admin/auth', `status ${auth.res.status}`);

  const dashboard = await fetchJson(`${ADMIN_URL}/dashboard`, { headers });
  if (dashboard.res.status === 200) pass('GET /admin/dashboard');
  else fail('GET /admin/dashboard', `status ${dashboard.res.status}`);

  const patterns = await fetchJson(`${ADMIN_URL}/patterns?limit=1`, { headers });
  if (patterns.res.status === 200) pass('GET /admin/patterns');
  else fail('GET /admin/patterns', `status ${patterns.res.status}`);

  const settings = await fetchJson(`${ADMIN_URL}/settings`, { headers });
  if (settings.res.status === 200) pass('GET /admin/settings');
  else fail('GET /admin/settings', `status ${settings.res.status}`);

  const putSettings = await fetchJson(`${ADMIN_URL}/settings`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ values: { site_name: 'smoke-test' } }),
  });
  if (putSettings.res.status === 200) pass('PUT /admin/settings');
  else fail('PUT /admin/settings', `status ${putSettings.res.status}`);

  const sitemap = await fetchJson(`${ADMIN_URL}/seo/sitemap`, { headers });
  if (sitemap.res.status === 200) pass('GET /admin/seo/sitemap');
  else fail('GET /admin/seo/sitemap', `status ${sitemap.res.status}`);

  const metadata = await fetchJson(`${ADMIN_URL}/seo/metadata`, { headers });
  if (metadata.res.status === 200) pass('GET /admin/seo/metadata');
  else fail('GET /admin/seo/metadata', `status ${metadata.res.status}`);

  const redirectsList = await fetchJson(`${ADMIN_URL}/seo/redirects`, { headers });
  if (redirectsList.res.status === 200) pass('GET /admin/seo/redirects');
  else fail('GET /admin/seo/redirects', `status ${redirectsList.res.status}`);

  const oldPath = `/smoke-old-${Date.now()}`;
  const create = await fetchJson(`${ADMIN_URL}/seo/redirects`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ old_path: oldPath, new_path: '/smoke-new', code: 301 }),
  });
  if (create.res.status === 201) pass('POST /admin/seo/redirects');
  else fail('POST /admin/seo/redirects', `status ${create.res.status}`);

  const id = (create.data?.data as Record<string, unknown> | undefined)?.id as string | undefined;
  if (id) {
    const update = await fetchJson(`${ADMIN_URL}/seo/redirects/${id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ old_path: `${oldPath}-updated` }),
    });
    if (update.res.status === 200) pass('PUT /admin/seo/redirects/:id');
    else fail('PUT /admin/seo/redirects/:id', `status ${update.res.status}`);

    const del = await fetchJson(`${ADMIN_URL}/seo/redirects/${id}`, { method: 'DELETE', headers });
    if (del.res.status === 200) pass('DELETE /admin/seo/redirects/:id');
    else fail('DELETE /admin/seo/redirects/:id', `status ${del.res.status}`);
  } else {
    fail('extract redirect id from create response');
  }
}

async function main() {
  await publicSmoke();
  await frontendSmoke();
  await adminSmoke();
  console.log('== Summary ==');
  console.log(`PASS: ${result.pass}, FAIL: ${result.fail}`);
  if (result.fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
