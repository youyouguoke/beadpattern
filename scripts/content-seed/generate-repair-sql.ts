import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, 'data/patterns-all-300.json');
const sqlPath = path.join(__dirname, 'data/repair-associations.sql');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as {
  patterns: Array<{
    id: string;
    slug: string;
    category_slugs?: string[];
    tag_slugs?: string[];
    collection_slugs?: string[];
  }>;
};

const categoryMap: Record<string, string> = {
  animals: 'cat_animals',
  characters: 'cat_characters',
  'food-drink': 'cat_food',
  nature: 'cat_nature',
  gaming: 'cat_gaming',
  'seasonal-holidays': 'cat_seasonal',
  'fantasy-mythical': 'cat_fantasy',
  'objects-symbols': 'cat_objects',
};

const tagMap: Record<string, string> = {
  animals: 'tag_animals',
  kawaii: 'tag_kawaii',
  cute: 'tag_cute',
  easy: 'tag_easy',
  'pixel-art': 'tag_pixel_art',
  nature: 'tag_nature',
  medium: 'tag_medium',
  fantasy: 'tag_fantasy',
  food: 'tag_food',
  halloween: 'tag_halloween',
  christmas: 'tag_christmas',
  flowers: 'tag_flowers',
  seasonal: 'tag_seasonal',
  'gaming-inspired': 'tag_gaming',
  retro: 'tag_retro',
  characters: 'tag_characters',
  objects: 'tag_objects',
};

const lines: string[] = [];
lines.push('-- Auto-generated association repair SQL');
// D1 remote execute does not support BEGIN/COMMIT statements in uploaded SQL files.

const collectionMap: Record<string, string> = {};

// Discover current collection IDs by slug from remote D1
collectionMap['cute-animals'] = 'col_cute_animals';
collectionMap['pocket-pets'] = 'col_pocket_pets';
collectionMap['farm-friends'] = 'col_farm_friends';
collectionMap['ocean-life'] = 'col_ocean_life';
collectionMap['baby-animals'] = 'col_baby_animals';
collectionMap['safari'] = 'col_safari';
collectionMap['cute-animals'] = 'col_cute_animals';
collectionMap['foodie-kawaii'] = 'col_foodie_kawaii';
collectionMap['halloween'] = 'col_halloween';
collectionMap['christmas'] = 'col_christmas';
collectionMap['spring'] = 'col_spring';
collectionMap['valentines'] = 'col_valentines';
collectionMap['gaming-classics'] = 'col_gaming_classics';
collectionMap['fantasy-world'] = 'col_fantasy_world';
collectionMap['emoji'] = 'col_emoji';
collectionMap['space'] = 'col_space';
collectionMap['music'] = 'col_music';
collectionMap['sports'] = 'col_sports';
collectionMap['patriotic'] = 'col_patriotic';
collectionMap['birthday'] = 'col_birthday';
collectionMap['letters-numbers'] = 'col_letters_numbers';

const pcRows = new Set<string>();
const ptRows = new Set<string>();
const pcolRows = new Set<string>();

for (const p of data.patterns) {
  for (const cs of p.category_slugs || []) {
    const cid = categoryMap[cs];
    if (cid) {
      const key = `${p.id}|${cid}`;
      if (!pcRows.has(key)) {
        pcRows.add(key);
        lines.push(`INSERT OR IGNORE INTO pattern_categories (pattern_id, category_id) VALUES ('${p.id}', '${cid}');`);
      }
    }
  }

  for (const ts of p.tag_slugs || []) {
    const tid = tagMap[ts];
    if (tid) {
      const key = `${p.id}|${tid}`;
      if (!ptRows.has(key)) {
        ptRows.add(key);
        lines.push(`INSERT OR IGNORE INTO pattern_tags (pattern_id, tag_id) VALUES ('${p.id}', '${tid}');`);
      }
    }
  }

  for (const cs of p.collection_slugs || []) {
    const cid = collectionMap[cs] ?? cs;
    if (cid) {
      const key = `${p.id}|${cid}`;
      if (!pcolRows.has(key)) {
        pcolRows.add(key);
        lines.push(`INSERT OR IGNORE INTO pattern_collections (pattern_id, collection_id, display_order) VALUES ('${p.id}', '${cid}', 0);`);
      }
    }
  }
}

lines.push('');
lines.push(`-- Generated ${pcRows.size} pattern_categories rows, ${ptRows.size} pattern_tags rows, and ${pcolRows.size} pattern_collections rows`);

fs.writeFileSync(sqlPath, lines.join('\n'));
console.log(`Wrote ${sqlPath}`);
console.log(`pattern_categories: ${pcRows.size}`);
console.log(`pattern_tags: ${ptRows.size}`);
