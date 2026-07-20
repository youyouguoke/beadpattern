import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { imageToGrid } from './pipeline/image-to-grid.js';
import { PixelPatternOptimizer } from './pipeline/optimizer.js';
import { QualityEngine } from './pipeline/grid.js';
import { BeadRenderer } from './renderer/bead-renderer.js';
import { generatePatternPdf } from './renderer/pdf-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REF_IMAGE = path.join(__dirname, 'data', 'reference', 'panda.jpg');
const OUT_DIR = path.join(__dirname, 'data', 'panda-from-reference');
const SIZE = 29;
const MAX_COLORS = 5;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Reference Image → Image Processing → Pixelization → Color Quantization
  const { grid: rawGrid, palette } = await imageToGrid(REF_IMAGE, {
    size: SIZE,
    maxColors: MAX_COLORS,
  });

  console.log('Raw palette:', palette);

  // 2. Grid Optimization
  const bgColor = palette.sort((a, b) => (b.count || 0) - (a.count || 0))[0].hex;
  const optimizer = new PixelPatternOptimizer();
  let optimized = optimizer.optimize(rawGrid, bgColor, {
    targetSubjectRatio: 0.85,
    maxColors: MAX_COLORS,
  });
  // Force symmetry
  optimized = optimized.map((row) => {
    const mid = Math.floor(SIZE / 2);
    const out = [...row];
    for (let x = 0; x < mid; x++) {
      out[SIZE - 1 - x] = out[x];
    }
    return out;
  });

  const quality = new QualityEngine();
  const { score, reasons } = quality.evaluate(optimized, bgColor);
  console.log(`QA score: ${score.toFixed(1)}/100`, reasons.length ? `(${reasons.join(', ')})` : '');

  // 3. Renderer
  const gridOutput = {
    grid: optimized,
    palette: palette.map((p) => ({ name: p.name, hex: p.hex })),
    score,
    rejected: score < 75,
    reasons,
  };
  const renderer = new BeadRenderer();
  const { cover, finished, thumbnail } = renderer.render(gridOutput, {
    category: 'animal',
    gridSize: SIZE,
    margin: 0,
    padding: 0,
    symmetry: 'vertical',
    composition: 'center',
    outline: 'strong',
    style: 'cute',
    maxColors: MAX_COLORS,
    background: bgColor,
  }, 'Cute Panda');
  const gridPng = renderer.renderGrid(optimized);
  const pdf = await generatePatternPdf({
    title: 'Cute Panda',
    grid: optimized,
    palette: gridOutput.palette,
    gridSize: `${SIZE}x${SIZE}`,
    beadCount: optimized.flat().filter((c) => c !== bgColor).length,
    difficulty: 'Easy',
  });

  fs.writeFileSync(path.join(OUT_DIR, 'cover.png'), cover);
  fs.writeFileSync(path.join(OUT_DIR, 'finished.png'), finished);
  fs.writeFileSync(path.join(OUT_DIR, 'thumbnail.png'), thumbnail);
  fs.writeFileSync(path.join(OUT_DIR, 'grid.png'), gridPng);
  fs.writeFileSync(path.join(OUT_DIR, 'pattern.pdf'), pdf);
  fs.writeFileSync(path.join(OUT_DIR, 'grid.json'), JSON.stringify(optimized, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'colors.json'), JSON.stringify({
    used: Array.from(new Set(optimized.flat())).map((hex) => ({
      hex,
      name: hex,
      count: optimized.flat().filter((c) => c === hex).length,
    })),
  }, null, 2));

  console.log('Output:', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
