import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderPatternImage, canvasToPngBuffer } from './render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../content-seed/data/patterns-all-300.json');
const OUT_DIR = path.join(__dirname, 'data');

type ColorPaletteItem = { hex?: string; name?: string } | string;

interface PatternSeed {
  slug: string;
  title: string;
  grid_data?: unknown;
  grid_size?: string | null;
  estimated_beads?: number | null;
  color_count?: number | null;
  color_palette?: ColorPaletteItem[] | null;
}

interface SeedFile {
  patterns: PatternSeed[];
}

function generateFor(slug: string, patterns: PatternSeed[], finished: boolean) {
  const p = patterns.find((p) => p.slug === slug);
  if (!p) throw new Error(`Pattern ${slug} not found`);
  const canvas = renderPatternImage(p.grid_data, {
    finished,
    title: p.title,
    gridSize: p.grid_size ?? undefined,
    estimatedBeads: p.estimated_beads ?? undefined,
    colorCount: p.color_count ?? undefined,
    colorPalette: p.color_palette ?? undefined,
  });
  const buffer = canvasToPngBuffer(canvas);
  const suffix = finished ? 'finished' : 'cover';
  const filePath = path.join(OUT_DIR, `${slug}-${suffix}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filePath} (${buffer.length} bytes)`);
  return filePath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data: SeedFile = JSON.parse(raw);
  const patterns = data.patterns;

  for (const slug of ['cute-panda', 'frog-prince']) {
    generateFor(slug, patterns, false);
    generateFor(slug, patterns, true);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
