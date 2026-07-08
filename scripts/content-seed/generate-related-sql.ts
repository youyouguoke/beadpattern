import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, 'data/patterns-all-300.json');
const sqlPath = path.join(__dirname, 'data/repair-related.sql');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as {
  patterns: Array<{
    id: string;
    slug: string;
    collection_slugs?: string[];
    tag_slugs?: string[];
  }>;
};

const now = new Date().toISOString();
const patternById = new Map(data.patterns.map((p) => [p.id, p]));

function quote(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function uuid(): string {
  return crypto.randomUUID();
}

// Build index for fast lookup
const byCollection = new Map<string, string[]>();
const byTag = new Map<string, string[]>();

for (const p of data.patterns) {
  for (const c of p.collection_slugs || []) {
    if (!byCollection.has(c)) byCollection.set(c, []);
    byCollection.get(c)!.push(p.id);
  }
  for (const t of p.tag_slugs || []) {
    if (!byTag.has(t)) byTag.set(t, []);
    byTag.get(t)!.push(p.id);
  }
}

const lines: string[] = [];
lines.push('-- Auto-generated related-patterns repair SQL');
lines.push('-- Prioritizes: same collection, same tag, then any published pattern');
lines.push('-- INSERT OR IGNORE avoids duplicates on re-runs');
lines.push('');

let total = 0;

for (const p of data.patterns) {
  const related = new Set<string>();

  // 1. same collection
  for (const c of p.collection_slugs || []) {
    const others = byCollection.get(c) || [];
    for (const other of others) {
      if (other !== p.id) related.add(other);
    }
  }

  // 2. same tag (if still less than 4)
  if (related.size < 4) {
    for (const t of p.tag_slugs || []) {
      const others = byTag.get(t) || [];
      for (const other of others) {
        if (other !== p.id) related.add(other);
      }
      if (related.size >= 4) break;
    }
  }

  // 3. fallback: random others
  if (related.size < 4) {
    for (const other of data.patterns) {
      if (other.id !== p.id) related.add(other.id);
      if (related.size >= 4) break;
    }
  }

  const ordered = Array.from(related).slice(0, 4);
  for (let i = 0; i < ordered.length; i++) {
    const relatedId = ordered[i];
    const relatedPattern = patternById.get(relatedId);
    if (!relatedPattern) continue;

    const type = (p.collection_slugs || []).some((c) =>
      (relatedPattern.collection_slugs || []).includes(c)
    )
      ? 'same_collection'
      : (p.tag_slugs || []).some((t) =>
          (relatedPattern.tag_slugs || []).includes(t)
        )
      ? 'same_tag'
      : 'similar';

    lines.push(`INSERT OR IGNORE INTO pattern_related (id, pattern_id, related_pattern_id, related_type, score, display_order, created_at) VALUES (${quote(uuid())}, ${quote(p.id)}, ${quote(relatedId)}, ${quote(type)}, 1, ${i}, ${quote(now)});`);
    total++;
  }
}

lines.push('');
lines.push(`-- Generated ${total} related rows`);

fs.writeFileSync(sqlPath, lines.join('\n'));
console.log(`Wrote ${sqlPath}`);
console.log(`related: ${total}`);
