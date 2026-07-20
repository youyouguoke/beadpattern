import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ControlledGridGenerator } from './pipeline/grid.js';
import { TemplateRenderer } from './pipeline/render.js';
import { getSpecByCategory, DEFAULT_BEAD_PALETTE } from './pipeline/specs.js';
import type { PatternConfig } from './pipeline/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data');

const SAMPLES: { slug: string; subject: string; category: string; palette: { name: string; hex: string }[] }[] = [
  {
    slug: 'cute-panda',
    subject: 'Cute Panda',
    category: 'animal',
    palette: [
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'White', hex: '#f5f5f5' },
      { name: 'Gray', hex: '#bdbdbd' },
      { name: 'Pink', hex: '#f06292' },
      { name: 'Background', hex: '#ffffff' },
    ],
  },
  {
    slug: 'frog-prince',
    subject: 'Frog Prince',
    category: 'animal',
    palette: [
      { name: 'Green', hex: '#2e7d32' },
      { name: 'Light Green', hex: '#7cb342' },
      { name: 'Black', hex: '#1a1a1a' },
      { name: 'Gold', hex: '#fbc02d' },
      { name: 'Background', hex: '#ffffff' },
    ],
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const gridGen = new ControlledGridGenerator();
  const renderer = new TemplateRenderer();

  for (const sample of SAMPLES) {
    const spec = getSpecByCategory(sample.category);
    const config: PatternConfig = {
      slug: sample.slug,
      subject: sample.subject,
      spec,
      palette: sample.palette,
    };

    console.log(`\nGenerating ${sample.slug}...`);
    const gridOutput = gridGen.generate(config);
    console.log(`  QA score: ${gridOutput.score}/100`);
    if (gridOutput.rejected) {
      console.log(`  REJECTED: ${gridOutput.reasons.join(', ')}`);
    }

    const { cover, finished, thumbnail } = renderer.render(gridOutput, spec, sample.subject);

    const coverPath = path.join(OUT_DIR, `${sample.slug}-cover.png`);
    const finishedPath = path.join(OUT_DIR, `${sample.slug}-finished.png`);
    const thumbnailPath = path.join(OUT_DIR, `${sample.slug}-thumbnail.png`);
    const gridPath = path.join(OUT_DIR, `${sample.slug}-grid.json`);

    fs.writeFileSync(coverPath, cover);
    fs.writeFileSync(finishedPath, finished);
    fs.writeFileSync(thumbnailPath, thumbnail);
    fs.writeFileSync(gridPath, JSON.stringify(gridOutput.grid));

    console.log(`  Cover: ${coverPath}`);
    console.log(`  Finished: ${finishedPath}`);
    console.log(`  Thumbnail: ${thumbnailPath}`);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
