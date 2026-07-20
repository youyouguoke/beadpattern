import { compose } from './composer.js';
import { renderGrid, canvasToPngBuffer, gridToSvg } from './renderer.js';
import type { CharacterConfig, TailStyle, EyeStyle, EarStyle, Accessory } from './types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TestCase {
  title: string;
  slug: string;
  config: CharacterConfig;
}

const tests: TestCase[] = [
  {
    title: 'Cute Cat Sitting',
    slug: 'cute-cat-sitting',
    config: {
      animal: 'cat',
      title: 'Cute Cat Sitting',
      slug: 'cute-cat-sitting',
      pose: 'sitting',
      ear: 'pointed',
      eye: 'cute',
      tail: 'curl',
      accessory: 'bow',
      palette: 'gray-cat',
      gridSize: 32,
    },
  },
  {
    title: 'Sleepy Cat',
    slug: 'sleepy-cat',
    config: {
      animal: 'cat',
      title: 'Sleepy Cat',
      slug: 'sleepy-cat',
      pose: 'sleeping',
      ear: 'rounded',
      eye: 'sleepy',
      tail: 'left',
      accessory: 'none',
      palette: 'orange-cat',
      gridSize: 32,
    },
  },
  {
    title: 'Anime Cat',
    slug: 'anime-cat',
    config: {
      animal: 'cat',
      title: 'Anime Cat',
      slug: 'anime-cat',
      pose: 'sitting',
      ear: 'large',
      eye: 'anime',
      tail: 'right',
      accessory: 'heart',
      palette: 'gray-cat',
      gridSize: 32,
    },
  },
  {
    title: 'Corgi Sitting',
    slug: 'corgi-sitting',
    config: {
      animal: 'dog',
      title: 'Corgi Sitting',
      slug: 'corgi-sitting',
      pose: 'sitting',
      ear: 'rounded',
      eye: 'happy',
      tail: 'fluffy',
      accessory: 'none',
      palette: 'corgi',
      gridSize: 32,
    },
  },
  {
    title: 'Shiba Inu',
    slug: 'shiba-inu',
    config: {
      animal: 'dog',
      title: 'Shiba Inu',
      slug: 'shiba-inu',
      pose: 'sitting',
      ear: 'pointed',
      eye: 'cute',
      tail: 'curl',
      accessory: 'none',
      palette: 'shiba',
      gridSize: 32,
    },
  },
  {
    title: 'Panda Holding Bamboo',
    slug: 'panda-holding-bamboo',
    config: {
      animal: 'panda',
      title: 'Panda Holding Bamboo',
      slug: 'panda-holding-bamboo',
      pose: 'holding',
      ear: 'rounded',
      eye: 'cute',
      tail: 'none',
      accessory: 'bamboo',
      palette: 'panda',
      gridSize: 32,
    },
  },
  {
    title: 'Fox Sitting',
    slug: 'fox-sitting',
    config: {
      animal: 'fox',
      title: 'Fox Sitting',
      slug: 'fox-sitting',
      pose: 'sitting',
      ear: 'pointed',
      eye: 'cute',
      tail: 'fluffy',
      accessory: 'none',
      palette: 'fox',
      gridSize: 32,
    },
  },
  {
    title: 'Penguin Standing',
    slug: 'penguin-standing',
    config: {
      animal: 'penguin',
      title: 'Penguin Standing',
      slug: 'penguin-standing',
      pose: 'standing',
      ear: 'small',
      eye: 'round',
      tail: 'none',
      accessory: 'bow',
      palette: 'penguin',
      gridSize: 32,
    },
  },
  {
    title: 'Lion Sitting',
    slug: 'lion-sitting',
    config: {
      animal: 'lion',
      title: 'Lion Sitting',
      slug: 'lion-sitting',
      pose: 'sitting',
      ear: 'rounded',
      eye: 'cute',
      tail: 'fluffy',
      accessory: 'none',
      palette: 'lion',
      gridSize: 32,
    },
  },
  {
    title: 'Bunny Sitting',
    slug: 'bunny-sitting',
    config: {
      animal: 'bunny',
      title: 'Bunny Sitting',
      slug: 'bunny-sitting',
      pose: 'sitting',
      ear: 'large',
      eye: 'cute',
      tail: 'fluffy',
      accessory: 'bow',
      palette: 'bunny',
      gridSize: 32,
    },
  },
];

async function main() {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const summary: { slug: string; title: string; colors: number; palette: string; url: string }[] = [];

  for (const t of tests) {
    const result = compose(t.config);
    const canvas = renderGrid(result.grid, result.palette, { beadSize: 16, gap: 1 });
    const buffer = canvasToPngBuffer(canvas);
    const outPath = path.join(outDir, `${t.slug}.png`);
    fs.writeFileSync(outPath, buffer);
    const svg = gridToSvg(result.grid, result.palette, 20);
    fs.writeFileSync(path.join(outDir, `${t.slug}.svg`), svg);
    const json = {
      title: t.title,
      slug: t.slug,
      gridSize: result.grid.length,
      colorCount: result.colorMap.length - 1,
      palette: result.palette.name,
      swatches: result.palette.swatches.map((s, i) => ({ index: i + 1, ...s })),
      grid: result.grid,
    };
    fs.writeFileSync(path.join(outDir, `${t.slug}.json`), JSON.stringify(json, null, 2));
    summary.push({ slug: t.slug, title: t.title, colors: result.colorMap.length - 1, palette: result.palette.name, url: `MEDIA:${outPath}` });
  }

  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('Generated 10 test patterns:');
  for (const s of summary) {
    console.log(`- ${s.title} (${s.colors} colors) ${s.url}`);
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
