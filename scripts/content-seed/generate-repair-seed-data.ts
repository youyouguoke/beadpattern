import fs from 'fs';
import path from 'path';

const dataPath = 'scripts/content-seed/data/patterns-all-300.json';
const outPath = 'src/routes/admin/repair-seed-data.ts';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as {
  patterns: Array<{
    slug: string;
    category_slugs?: string[];
    tag_slugs?: string[];
    collection_slugs?: string[];
  }>;
};

const associations = data.patterns.map((p) => ({
  slug: p.slug,
  category_slugs: p.category_slugs || [],
  tag_slugs: p.tag_slugs || [],
  collection_slugs: p.collection_slugs || [],
}));

const content = `// Auto-generated compact seed association data. Generated from scripts/content-seed/data/patterns-all-300.json.
export const seedAssociations = ${JSON.stringify(associations)} as Array<{
  slug: string;
  category_slugs: string[];
  tag_slugs: string[];
  collection_slugs: string[];
}>;
`;

fs.writeFileSync(outPath, content);
console.log(`Wrote ${outPath} with ${associations.length} pattern associations`);
