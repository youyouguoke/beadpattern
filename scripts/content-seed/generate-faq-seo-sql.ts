import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, 'data/patterns-all-300.json');
const sqlPath = path.join(__dirname, 'data/repair-faqs-seo.sql');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as {
  patterns: Array<{
    id: string;
    slug: string;
    faqs?: Array<{ question: string; answer: string; display_order?: number }>;
    related_slugs?: string[];
    seo_variants?: Array<{ variant: string; landing_slug: string; search_intent: string; display_order?: number }>;
  }>;
};

const patternBySlug = new Map(data.patterns.map((p) => [p.slug, p]));
const now = new Date().toISOString();

function quote(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function uuid(): string {
  return crypto.randomUUID();
}

const lines: string[] = [];
lines.push('-- Auto-generated FAQ / SEO / Related repair SQL');
lines.push('-- INSERT OR IGNORE is used to avoid duplicates on re-runs');

let faqCount = 0;
let seoCount = 0;
let relatedCount = 0;

for (const p of data.patterns) {
  // FAQs
  for (const faq of p.faqs || []) {
    lines.push(`INSERT OR IGNORE INTO pattern_faqs (id, pattern_id, question, answer, display_order, created_at, updated_at) VALUES (${quote(uuid())}, ${quote(p.id)}, ${quote(faq.question)}, ${quote(faq.answer)}, ${faq.display_order ?? 0}, ${quote(now)}, ${quote(now)});`);
    faqCount++;
  }

  // SEO variants
  for (const variant of p.seo_variants || []) {
    lines.push(`INSERT OR IGNORE INTO pattern_seo_variants (id, pattern_id, variant, landing_slug, search_intent, display_order, created_at) VALUES (${quote(uuid())}, ${quote(p.id)}, ${quote(variant.variant)}, ${quote(variant.landing_slug)}, ${quote(variant.search_intent)}, ${variant.display_order ?? 0}, ${quote(now)});`);
    seoCount++;
  }

  // Related patterns (manual)
  for (const relatedSlug of p.related_slugs || []) {
    const relatedPattern = patternBySlug.get(relatedSlug);
    if (relatedPattern) {
      lines.push(`INSERT OR IGNORE INTO pattern_related (id, pattern_id, related_pattern_id, related_type, score, display_order, created_at) VALUES (${quote(uuid())}, ${quote(p.id)}, ${quote(relatedPattern.id)}, 'manual', 1, 0, ${quote(now)});`);
      relatedCount++;
    }
  }
}

lines.push('');
lines.push(`-- Generated ${faqCount} FAQs, ${seoCount} SEO variants, and ${relatedCount} related rows`);

fs.writeFileSync(sqlPath, lines.join('\n'));
console.log(`Wrote ${sqlPath}`);
console.log(`faqs: ${faqCount}`);
console.log(`seo_variants: ${seoCount}`);
console.log(`related: ${relatedCount}`);
