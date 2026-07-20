import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8787/api';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';
const DRY_RUN = process.env.DRY_RUN === 'true';
const CONCURRENCY = Number(process.env.CONCURRENCY || '5');

import * as renderModule from './render.js';
const renderPatternImage = renderModule.renderPatternImage;
const canvasToPngBuffer = renderModule.canvasToPngBuffer;

type PatternRow = {
  id: string;
  slug: string;
  title: string;
  grid_data: string;
  color_palette: string;
  cover_image?: string | null;
  finished_image?: string | null;
};

async function getMissingPatterns(): Promise<PatternRow[]> {
  const raw = fs.readFileSync(path.join(__dirname, 'data', 'missing-patterns.json'), 'utf8');
  return JSON.parse(raw) as PatternRow[];
}

async function uploadImage(buffer: Buffer, filename: string, type: string): Promise<{ id: string; url: string; r2_key: string }> {
  const module = await import('form-data');
  const FormData = (module as any).default || module;
  const form = new FormData();
  form.append('file', buffer, { filename, contentType: 'image/png' });
  form.append('type', type);
  const res = await fetch(`${API_BASE}/admin/media/upload-image`, {
    method: 'POST',
    body: form,
    headers: { Authorization: `Bearer ${ADMIN_KEY}`, ...form.getHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json = await res.json() as { data: { id: string; url: string; r2_key: string } };
  return json.data;
}

async function updatePattern(id: string, fields: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/admin/patterns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
    headers: { Authorization: `Bearer ${ADMIN_KEY}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed: ${res.status} ${text}`);
  }
}

function parseGrid(data: string): number[][] {
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function processPattern(p: PatternRow, index: number): Promise<{ slug: string; ok: boolean; error?: string; cover?: string; finished?: string }> {
  try {
    const grid = parseGrid(p.grid_data);
    if (!grid || grid.length === 0 || grid[0].length === 0) {
      return { slug: p.slug, ok: false, error: 'empty grid_data' };
    }

    const coverCanvas = renderPatternImage(grid, { finished: false });
    const coverBuffer = canvasToPngBuffer(coverCanvas);
    const finishedCanvas = renderPatternImage(grid, { finished: true });
    const finishedBuffer = canvasToPngBuffer(finishedCanvas);

    let cover: { id: string; url: string; r2_key: string } | undefined;
    let finished: { id: string; url: string; r2_key: string } | undefined;

    if (!DRY_RUN) {
      cover = await uploadImage(coverBuffer, `${p.slug}-cover.png`, 'cover');
      finished = await uploadImage(finishedBuffer, `${p.slug}-finished.png`, 'finished');
      await updatePattern(p.id, {
        cover_image: cover.url,
        finished_image: finished.url,
        cover_image_r2_key: cover.r2_key,
        cover_media_id: cover.id,
        finished_media_id: finished.id,
        grid_status: 'ready',
      });
    }

    console.log(`[${index + 1}] ${p.slug} -> cover=${cover?.url || 'dry'} finished=${finished?.url || 'dry'}`);
    return { slug: p.slug, ok: true, cover: cover?.url, finished: finished?.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${index + 1}] ${p.slug} ERROR: ${msg}`);
    return { slug: p.slug, ok: false, error: msg };
  }
}

async function run() {
  const patterns = await getMissingPatterns();
  console.log(`Found ${patterns.length} patterns missing R2 cover images. DRY_RUN=${DRY_RUN}`);
  if (patterns.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const results: { slug: string; ok: boolean; error?: string; cover?: string; finished?: string }[] = [];
  for (let i = 0; i < patterns.length; i += CONCURRENCY) {
    const batch = patterns.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((p, idx) => processPattern(p, i + idx)));
    results.push(...batchResults);
  }

  const success = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const summary = { total: results.length, success: success.length, failed: failed.length, errors: failed.slice(0, 20) };

  const outDir = path.join(__dirname, 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `backfill-r2-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ results, summary }, null, 2));
  console.log('\nSummary:', JSON.stringify(summary, null, 2));
  console.log(`Saved to ${outPath}`);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
