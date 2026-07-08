import { normalizeSlug } from '../../src/lib/slug';
import { PATTERN_IDEAS } from './ideas-sample';
import fs from 'node:fs';
import path from 'node:path';

const PALETTES = {
  panda: ['#000000', '#ffffff', '#ff69b4', '#87ceeb'],
  cat: ['#ffa500', '#ffffff', '#000000', '#ff69b4'],
  dog: ['#8b4513', '#ffffff', '#000000', '#ff4500'],
  bunny: ['#ffffff', '#ff69b4', '#000000', '#ffd700'],
  hamster: ['#deb887', '#ffffff', '#000000', '#ff4500'],
  fox: ['#ff4500', '#ffffff', '#000000', '#ffd700'],
  cow: ['#ffffff', '#000000', '#ff69b4', '#87ceeb'],
  pig: ['#ffb6c1', '#ffffff', '#000000', '#ff69b4'],
  chick: ['#ffff00', '#ffa500', '#000000', '#ffffff'],
  whale: ['#4682b4', '#ffffff', '#000000', '#87ceeb'],
  dolphin: ['#87ceeb', '#ffffff', '#000000', '#ffd700'],
  turtle: ['#32cd32', '#8b4513', '#000000', '#ffd700'],
  lion: ['#ffa500', '#8b4513', '#000000', '#ffffff'],
  giraffe: ['#ffd700', '#8b4513', '#000000', '#ffffff'],
  koala: ['#a9a9a9', '#ffffff', '#000000', '#ff69b4'],
  hedgehog: ['#8b4513', '#ffffff', '#000000', '#ffd700'],
  penguin: ['#000000', '#ffffff', '#ffa500', '#87ceeb'],
  owl: ['#8b4513', '#ffffff', '#ffd700', '#000000'],
  frog: ['#32cd32', '#ffffff', '#000000', '#ffd700'],
  ladybug: ['#ff0000', '#000000', '#ffffff', '#ffd700'],
};

function pickPalette(subject: string) {
  return PALETTES[subject as keyof typeof PALETTES] ?? ['#ff69b4', '#ffffff', '#000000', '#87ceeb'];
}

function makeGrid(size: number, palette: string[]) {
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      const i = Math.abs(Math.sin((r + 1) * (c + 1) * (palette.length + 1)) * palette.length) | 0;
      row.push(palette[i % palette.length]);
    }
    grid.push(row);
  }
  return grid;
}

export function generateSamplePatterns() {
  return PATTERN_IDEAS.map((idea, index) => {
    const palette = pickPalette(idea.subject);
    const size = idea.difficulty === 'easy' ? 15 : 21;
    const grid = makeGrid(size, palette);
    const slug = normalizeSlug(idea.title);
    return {
      id: crypto.randomUUID(),
      slug,
      title: idea.title,
      subject: idea.subject,
      description: `A charming ${idea.subject} bead pattern designed in ${idea.style} style. Great for beginners and fun to make.`,
      category_slugs: idea.categories,
      collection_slugs: idea.collections,
      tag_slugs: idea.tags,
      style: idea.style,
      season: idea.season,
      difficulty: idea.difficulty,
      grid_size: `${size}x${size}`,
      grid_data: grid,
      color_palette: palette.map((hex) => ({ name: hex, hex, count: 0 })),
      estimated_time: `${size} min`,
      seo_priority: 50 + (index % 20),
      publish_order: index,
      grid_status: 'ready' as const,
      grid_designer: 'Seed Studio',
      grid_version: 1,
      grid_review_required: false,
      faqs: [
        { question: `How many beads for ${idea.title}?`, answer: `Around ${size * size} beads for this ${size}x${size} design.`, display_order: 0 },
        { question: 'What colors do I need?', answer: `You need ${palette.length} colors: ${palette.join(', ')}.`, display_order: 1 },
      ],
      related_slugs: [],
      seo_variants: [
        { variant: `${idea.title} Perler Bead Pattern`, landing_slug: `${slug}-perler`, search_intent: 'informational' as const, display_order: 0 },
        { variant: `${idea.title} Fuse Bead Pattern`, landing_slug: `${slug}-fuse-beads`, search_intent: 'commercial' as const, display_order: 1 },
      ],
      cover_image_url: `https://pub-freak-circus.r2.dev/covers/${slug}.png`,
      finished_image_url: `https://pub-freak-circus.r2.dev/finished/${slug}.png`,
    };
  });
}

export const samplePatterns = generateSamplePatterns();

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const out = { dry_run: false, patterns: samplePatterns };
  const outDir = path.resolve(new URL('.', import.meta.url).pathname, 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'sample-20.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('wrote', outPath);
}
