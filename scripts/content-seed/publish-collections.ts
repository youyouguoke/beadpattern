import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import collections from './collections.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PATTERNS_FILE = path.join(__dirname, 'data/patterns-all-300.json');

const API_BASE = process.env.API_BASE || 'https://api.beadpatternai.com';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';

type CollectionSeed = {
  title: string;
  slug: string;
  description: string;
  display_order: number;
  published: boolean;
  pattern_filters: Record<string, string>;
};

type PatternSeed = {
  slug: string;
  category_slugs?: string[];
  tag_slugs?: string[];
  difficulty?: string;
};

const typedCollections: CollectionSeed[] = collections as unknown as CollectionSeed[];

function loadPatterns(): PatternSeed[] {
  const raw = fs.readFileSync(PATTERNS_FILE, 'utf8');
  const data = JSON.parse(raw) as { patterns: PatternSeed[] };
  return data.patterns;
}

function matchesFilter(pattern: PatternSeed, filter: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (key === 'category') {
      if (!pattern.category_slugs?.includes(value)) return false;
    } else if (key === 'tag') {
      if (!pattern.tag_slugs?.includes(value)) return false;
    } else if (key === 'difficulty') {
      if ((pattern.difficulty || 'easy') !== value) return false;
    } else {
      return false;
    }
  }
  return true;
}

async function main() {
  const patterns = loadPatterns();
  for (const collection of typedCollections) {
    const filters = collection.pattern_filters as unknown as Record<string, string>;
    const slugs = patterns
      .filter((p) => matchesFilter(p, filters))
      .slice(0, 20)
      .map((p) => p.slug);

    const body: Record<string, unknown> = { ...collection, pattern_slugs: slugs };
    delete body.pattern_filters;

    const res = await fetch(`${API_BASE}/api/admin/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    console.log(res.status, collection.slug, data.success ? `patterns=${slugs.length}` : JSON.stringify(data));
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
