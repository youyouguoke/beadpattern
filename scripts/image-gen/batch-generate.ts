import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { DslGridGenerator, dslToPalette } from './pipeline/grid-generator.js';
import { GridOptimizer, QualityEngine } from './pipeline/grid.js';
import { AssetGenerator } from './renderer/asset-generator.js';
import type { PatternDSL, GridOutput } from './pipeline/types.js';

const API_BASE = process.env.API_BASE || 'https://bead-pattern-ai.youyouguoke.workers.dev/api';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';
const DRY_RUN = process.env.DRY_RUN === 'true';
const CONCURRENCY = Number(process.env.CONCURRENCY || '3');
const LIMIT = Number(process.env.LIMIT || '10');
const QUALITY_THRESHOLD = Number(process.env.QUALITY_THRESHOLD || '80');

interface PatternRow {
  id: string;
  slug: string;
  title: string;
  subject: string | null;
  style: string | null;
  grid_size: string | null;
  difficulty: string;
  grid_status?: string;
  cover_image?: string | null;
}

const PAGE_SIZE = Number(process.env.PAGE_SIZE || '50');

const SLUGS = process.env.SLUGS ? process.env.SLUGS.split(',').map(s => s.trim()).filter(Boolean) : null;

async function getPatterns(): Promise<PatternRow[]> {
  const all: PatternRow[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${API_BASE}/admin/patterns?limit=${PAGE_SIZE}&page=${page}`, {
      headers: { Authorization: `Bearer ${ADMIN_KEY}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch patterns page ${page}: ${res.status}`);
    const json = await res.json() as { data: { id: string; slug: string; title: string; subject: string | null; style: string | null; grid_size: string | null; difficulty: string; grid_status?: string; cover_image?: string | null }[] };
    if (json.data.length === 0) break;
    all.push(...json.data);
    if (LIMIT > 0 && all.length >= LIMIT) {
      break;
    }
    if (json.data.length < PAGE_SIZE) break;
    page++;
  }
  let filtered = all;
  if (LIMIT > 0) filtered = filtered.slice(0, LIMIT);
  if (SLUGS) filtered = filtered.filter((p) => SLUGS.includes(p.slug));
  return filtered;
}

async function uploadMedia(buffer: Buffer, filename: string, type: string): Promise<{ id: string; url: string; r2_key: string }> {
  const module = (await import('form-data')) as any;
  const FormData = module.default || module;
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

async function updatePattern(patternId: string, fields: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/patterns/${patternId}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
    headers: { Authorization: `Bearer ${ADMIN_KEY}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed: ${res.status} ${text}`);
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.toLowerCase().trim();
  let r = 0, g = 0, b = 0;
  if (h.length === 4 && h[0] === '#') {
    r = parseInt(h[1] + h[1], 16);
    g = parseInt(h[2] + h[2], 16);
    b = parseInt(h[3] + h[3], 16);
  } else if (h.length === 7 && h[0] === '#') {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  }
  return { r, g, b };
}

function brightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (r + g + b) / 3;
}

function pickBackground(palette: string[]): string {
  const candidates = ['#b0b0b0', '#c0c0c0', '#d0d0d0', '#e0e0e0', '#f0f0f0', '#ffffff'];
  const bodyColor = palette[0];
  const isLight = brightness(bodyColor) > 180;
  const ordered = isLight ? candidates : ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0', '#b0b0b0'];
  for (const bg of ordered) {
    if (!palette.includes(bg)) return bg;
  }
  return isLight ? '#b0b0b0' : '#ffffff';
}

function subjectToDsl(pattern: PatternRow): PatternDSL {
  const subject = (pattern.subject || 'default').toLowerCase().trim();
  const palette = dslToPalette({ subject, features: [], style: 'cute', symmetry: 'vertical', composition: 'center', outline: 'strong', maxColors: 5, background: '#ffffff', gridSize: 29, margin: 2 });
  return {
    subject,
    features: ['cute', 'centered'],
    style: 'cute',
    symmetry: 'vertical',
    composition: 'center',
    outline: 'strong',
    maxColors: 5,
    background: pickBackground(palette),
    gridSize: 29,
    margin: 2,
  };
}

async function processPattern(pattern: PatternRow, index: number): Promise<{ slug: string; ok: boolean; score: number; skipped?: boolean; error?: string }> {
  try {
    const isPlaceholder = !pattern.cover_image || pattern.cover_image.includes('placehold.co');
    const shouldSkip = !SLUGS && pattern.grid_status === 'ready' && !isPlaceholder;
    if (shouldSkip) {
      console.log(`[${index + 1}] ${pattern.slug} skipped (already ready)`);
      return { slug: pattern.slug, ok: true, score: 0, skipped: true };
    }

    const dsl = subjectToDsl(pattern);
    const palette = dslToPalette(dsl);
    const generator = new DslGridGenerator();
    const { grid, layers } = generator.generate({ dsl, palette });

    const optimizer = new GridOptimizer();
    const optimized = optimizer.optimize(grid, dsl.background);

    const quality = new QualityEngine();
    const q = quality.evaluateDetailed(optimized, dsl.background);

    if (q.total < QUALITY_THRESHOLD) {
      return { slug: pattern.slug, ok: false, score: q.total, error: `Quality score ${q.total.toFixed(1)} below threshold ${QUALITY_THRESHOLD}` };
    }

    const gridOutput: GridOutput = {
      grid: optimized,
      palette: palette.map((hex) => ({ name: hex, hex })),
      score: q.total,
      rejected: false,
      reasons: q.reasons,
      quality: q,
      layers,
    };

    const assets = await new AssetGenerator().generate({ gridOutput, title: pattern.title, dsl });

    let coverMedia: { id: string; url: string; r2_key: string } | undefined;
    let finishedMedia: { id: string; url: string; r2_key: string } | undefined;

    if (!DRY_RUN) {
      coverMedia = await uploadMedia(assets.cover, `${pattern.slug}-cover.png`, 'cover');
      finishedMedia = await uploadMedia(assets.preview, `${pattern.slug}-finished.png`, 'finished');
      await updatePattern(pattern.id, {
        cover_image: coverMedia.url,
        finished_image: finishedMedia.url,
        cover_image_r2_key: coverMedia.r2_key,
        cover_media_id: coverMedia.id,
        finished_media_id: finishedMedia.id,
        grid_data: optimized,
        color_palette: gridOutput.palette,
        color_count: gridOutput.palette.length,
        grid_size: `${optimized[0].length}x${optimized.length}`,
        estimated_beads: optimized.flat().filter((c) => c !== dsl.background).length,
        grid_status: 'ready',
      });
    }

    console.log(`[${index + 1}] ${pattern.slug} score=${q.total.toFixed(1)} cover=${coverMedia?.url || 'dry'}`);
    return { slug: pattern.slug, ok: true, score: q.total };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${index + 1}] ${pattern.slug} ERROR: ${msg}`);
    return { slug: pattern.slug, ok: false, score: 0, error: msg };
  }
}

async function run() {
  const patterns = await getPatterns();
  console.log(`Batch generator: ${patterns.length} patterns, dry_run=${DRY_RUN}, threshold=${QUALITY_THRESHOLD}, concurrency=${CONCURRENCY}`);

  const results: { slug: string; ok: boolean; score: number; error?: string }[] = [];
  for (let i = 0; i < patterns.length; i += CONCURRENCY) {
    const batch = patterns.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((p, idx) => processPattern(p, i + idx)));
    results.push(...batchResults);
  }

  const success = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const summary = {
    total: results.length,
    success: success.length,
    failed: failed.length,
    avgScore: success.length > 0 ? success.reduce((a, b) => a + b.score, 0) / success.length : 0,
    errors: failed.map((r) => ({ slug: r.slug, error: r.error, score: r.score })).slice(0, 20),
  };

  const outDir = path.join('data', 'batch-output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `batch-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ results, summary }, null, 2));
  console.log('\nSummary:', JSON.stringify(summary, null, 2));
  console.log(`Saved to ${outPath}`);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
