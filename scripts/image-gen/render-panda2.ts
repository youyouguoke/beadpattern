import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { imageToGrid } from './pipeline/image-to-grid.js';
import { BeadRenderer } from './renderer/bead-renderer.js';
import { generatePatternPdf } from './renderer/pdf-generator.js';
import { QualityEngine } from './pipeline/grid.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data', 'panda2-render');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const refPath = path.join(__dirname, 'data', 'reference', 'panda2.jpg');

  const { grid, palette } = await imageToGrid(refPath, { size: 29, maxColors: 6, targetFillRatio: 0.85, smoothing: true });
  const bgHex = palette.reduce((a, b) => (a.count > b.count ? a : b)).hex;

  const quality = new QualityEngine();
  const { score, reasons } = quality.evaluate(grid, bgHex);
  console.log(`QA score: ${score.toFixed(1)}/100`);
  if (score < 75) console.log('REJECTED:', reasons.join(', '));

  const gridOutput = { grid, palette: palette.map(p => ({ name: p.name, hex: p.hex })), score, rejected: score < 75, reasons };
  const renderer = new BeadRenderer();
  const { cover, finished, thumbnail } = renderer.render(gridOutput, { background: '#ffffff', gridSize: `${grid[0].length}x${grid.length}` }, 'Panda');
  const gridPng = renderer.renderGrid(grid);
  const pdf = await generatePatternPdf({
    title: 'Panda',
    grid,
    palette: gridOutput.palette,
    gridSize: `${grid[0].length}x${grid.length}`,
    beadCount: grid.flat().filter((c) => c !== bgHex).length,
    difficulty: 'Easy',
  });

  fs.writeFileSync(path.join(OUT_DIR, 'cover.png'), cover);
  fs.writeFileSync(path.join(OUT_DIR, 'finished.png'), finished);
  fs.writeFileSync(path.join(OUT_DIR, 'thumbnail.png'), thumbnail);
  fs.writeFileSync(path.join(OUT_DIR, 'grid.png'), gridPng);
  fs.writeFileSync(path.join(OUT_DIR, 'pattern.pdf'), pdf);
  fs.writeFileSync(path.join(OUT_DIR, 'grid.json'), JSON.stringify(grid));
  console.log('Palette:', palette);
  console.log('Output:', OUT_DIR);
}
main().catch((e) => { console.error(e); process.exit(1); });
