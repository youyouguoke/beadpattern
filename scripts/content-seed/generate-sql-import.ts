import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data/patterns-all-300.json');
const OUTPUT_FILE = path.join(__dirname, 'data/patterns-import.sql');

const raw = fs.readFileSync(DATA_FILE, 'utf8');
const data = JSON.parse(raw);
const patterns = data.patterns as any[];

const now = new Date().toISOString();

function quote(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value ? 1 : value);
  return "'" + String(value).replace(/'/g, "''") + "'";
}

const columns = [
  'id', 'slug', 'title', 'description', 'subject', 'style', 'season',
  'difficulty', 'difficulty_id', 'status', 'version', 'published_at',
  'cover_image', 'finished_image', 'cover_image_r2_key', 'cover_media_id',
  'finished_media_id', 'gallery_media_ids', 'step_media_ids', 'image_updated_at',
  'grid_size', 'grid_data', 'estimated_beads', 'color_count', 'color_palette',
  'grid_status', 'grid_designer', 'grid_version', 'grid_review_required',
  'grid_reviewed_at', 'estimated_time', 'seo_priority', 'publish_order',
  'seo_title', 'seo_description', 'seo_keywords', 'created_at', 'updated_at'
];

let sql = `-- Generated SQL import for ${patterns.length} patterns\n`;
sql += `DELETE FROM patterns;\n`;
sql += `DELETE FROM pattern_categories;\n`;
sql += `DELETE FROM pattern_collections;\n`;
sql += `DELETE FROM pattern_tags;\n`;
sql += `DELETE FROM pattern_faqs;\n`;
sql += `DELETE FROM pattern_related;\n`;
sql += `DELETE FROM pattern_seo_variants;\n`;
sql += `DELETE FROM pattern_seo;\n`;
sql += `DELETE FROM pattern_audit;\n`;
sql += `DELETE FROM analytics;\n`;
sql += `DELETE FROM pattern_steps;\n`;

for (const item of patterns) {
  const slug = item.slug ?? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const difficulty = item.difficulty || 'easy';
  const difficultyId = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const grid = item.grid_data ?? null;
  const palette = item.color_palette ? JSON.stringify(item.color_palette) : null;
  const stats = item.estimated_beads || item.color_count ? {
    estimated_beads: item.estimated_beads || 0,
    color_count: item.color_count || 0
  } : { estimated_beads: 0, color_count: 0 };

  const values = [
    item.id || crypto.randomUUID(),
    slug,
    item.title,
    item.description || null,
    item.subject || null,
    item.style || null,
    item.season || null,
    difficulty,
    difficultyId,
    'draft',
    1,
    null,
    item.cover_image_url || null,
    item.finished_image_url || null,
    null,
    null,
    null,
    null,
    null,
    null,
    item.grid_size || null,
    grid ? JSON.stringify(grid) : null,
    stats.estimated_beads || null,
    stats.color_count || null,
    palette,
    item.grid_status || 'missing',
    item.grid_designer || null,
    item.grid_version || 1,
    item.grid_review_required ? 1 : 0,
    null,
    item.estimated_time || null,
    item.seo_priority || 50,
    item.publish_order || 0,
    item.seo_title || item.title,
    item.seo_description || item.description || null,
    item.seo_keywords || null,
    now,
    now
  ];

  sql += `INSERT INTO patterns (${columns.join(', ')}) VALUES (${values.map(quote).join(', ')});\n`;
  sql += `INSERT OR IGNORE INTO analytics (pattern_id, views, likes, shares, downloads, updated_at) VALUES (${quote(values[0])}, 0, 0, 0, 0, ${quote(now)});\n`;

  // FAQs
  for (const faq of (item.faqs || [])) {
    sql += `INSERT OR IGNORE INTO pattern_faqs (id, pattern_id, question, answer, display_order, created_at, updated_at) VALUES (${quote(crypto.randomUUID())}, ${quote(values[0])}, ${quote(faq.question)}, ${quote(faq.answer)}, ${faq.display_order ?? 0}, ${quote(now)}, ${quote(now)});\n`;
  }

  // Related patterns
  for (const relatedSlug of (item.related_slugs || [])) {
    const relatedPattern = patterns.find((p: any) => p.slug === relatedSlug);
    if (relatedPattern) {
      sql += `INSERT OR IGNORE INTO pattern_related (id, pattern_id, related_pattern_id, related_type, score, display_order, created_at) VALUES (${quote(crypto.randomUUID())}, ${quote(values[0])}, ${quote(relatedPattern.id)}, 'manual', 1, 0, ${quote(now)});\n`;
    }
  }

  // SEO variants
  for (const variant of (item.seo_variants || [])) {
    sql += `INSERT OR IGNORE INTO pattern_seo_variants (id, pattern_id, variant, landing_slug, search_intent, display_order, created_at) VALUES (${quote(crypto.randomUUID())}, ${quote(values[0])}, ${quote(variant.variant)}, ${quote(variant.landing_slug)}, ${quote(variant.search_intent)}, ${variant.display_order ?? 0}, ${quote(now)});\n`;
  }

  // Steps
  const stepCount = item.steps?.length ?? 0;
  if (stepCount > 0) {
    for (let i = 0; i < item.steps.length; i++) {
      const s = item.steps[i];
      sql += `INSERT OR IGNORE INTO pattern_steps (id, pattern_id, step_number, description, image, grid_data, created_at, updated_at) VALUES (${quote(crypto.randomUUID())}, ${quote(values[0])}, ${i + 1}, ${quote(s.description ?? null)}, ${quote(s.image ?? null)}, ${s.grid_data ? quote(JSON.stringify(s.grid_data)) : 'NULL'}, ${quote(now)}, ${quote(now)});\n`;
    }
  }
}

fs.writeFileSync(OUTPUT_FILE, sql);
console.log(`Wrote ${patterns.length} patterns to ${OUTPUT_FILE}`);
