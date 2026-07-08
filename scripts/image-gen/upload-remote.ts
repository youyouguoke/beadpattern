import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { renderPatternImage, canvasToPngBuffer } from './render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../content-seed/data/patterns-all-300.json');
const API_BASE = process.env.API_BASE || 'https://bead-pattern-ai.youyouguoke.workers.dev/api';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';
const DRY_RUN = process.env.DRY_RUN === 'true';

const CONCURRENCY = 2;

type PatternSeed = {
  id: string;
  slug: string;
  title: string;
  grid_data?: unknown;
  cover_image_url?: string;
  finished_image_url?: string;
};

interface SeedFile {
  patterns: PatternSeed[];
}

async function uploadImage(buffer: Buffer, filename: string, type: string): Promise<{ id: string; url: string; r2_key: string }> {
  const form = new (require('form-data'))();
  form.append('file', buffer, { filename, contentType: 'image/png' });
  form.append('type', type);
  const headers = { Authorization: `Bearer ${ADMIN_KEY}`, ...form.getHeaders() };
  const res = await fetch(`${API_BASE}/media/upload-image`, { method: 'POST', body: form, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json = await res.json() as { data: { id: string; url: string; r2_key: string } };
  return json.data;
}

async function updatePatternMedia(patternId: string, coverMediaId?: string, finishedMediaId?: string) {
  const body: Record<string, string | undefined> = {};
  if (coverMediaId) body.cover_media_id = coverMediaId;
  if (finishedMediaId) body.finished_media_id = finishedMediaId;
  if (Object.keys(body).length === 0) return;
  const res = await fetch(`${API_BASE}/admin/patterns/${patternId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${ADMIN_KEY}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pattern update failed: ${res.status} ${text}`);
  }
}

async function processPattern(p: PatternSeed, index: number): Promise<{ slug: string; cover?: string; finished?: string; error?: string }> {
  try {
    const coverCanvas = renderPatternImage(p.grid_data, { finished: false });
    const coverBuffer = canvasToPngBuffer(coverCanvas);
    const finishedCanvas = renderPatternImage(p.grid_data, { finished: true });
    const finishedBuffer = canvasToPngBuffer(finishedCanvas);

    let cover: { id: string; url: string; r2_key: string } | undefined;
    let finished: { id: string; url: string; r2_key: string } | undefined;

    if (!DRY_RUN) {
      cover = await uploadImage(coverBuffer, `${p.slug}-cover.png`, 'cover');
      finished = await uploadImage(finishedBuffer, `${p.slug}-finished.png`, 'finished');
      await updatePatternMedia(p.id, cover?.id, finished?.id);
    }

    console.log(`[${index + 1}/300] ${p.slug} -> cover=${cover?.url || 'dry'} finished=${finished?.url || 'dry'}`);
    return { slug: p.slug, cover: cover?.url, finished: finished?.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${index + 1}/300] ${p.slug} ERROR: ${msg}`);
    return { slug: p.slug, error: msg };
  }
}

async function run() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data: SeedFile = JSON.parse(raw);
  const patterns = data.patterns;

  console.log(`Generating and uploading images for ${patterns.length} patterns...`);
  console.log(`DRY_RUN=${DRY_RUN}, API_BASE=${API_BASE}`);

  const results: { slug: string; cover?: string; finished?: string; error?: string }[] = [];
  for (let i = 0; i < patterns.length; i += CONCURRENCY) {
    const batch = patterns.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((p, idx) => processPattern(p, i + idx)));
    results.push(...batchResults);
  }

  const failed = results.filter((r) => r.error);
  const summary = {
    total: results.length,
    success: results.length - failed.length,
    failed: failed.length,
    errors: failed.map((r) => ({ slug: r.slug, error: r.error })).slice(0, 20),
  };

  const outDir = path.join(__dirname, 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `image-upload-remote-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ results, summary }, null, 2));
  console.log('\nSummary:', JSON.stringify(summary, null, 2));
  console.log(`Saved to ${outPath}`);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
