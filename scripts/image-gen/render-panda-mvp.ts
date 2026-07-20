import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePandaConfig, generatePandaGrid } from './pipeline/panda-test.js';
import { BeadRenderer } from './renderer/bead-renderer.js';
import { generatePatternPdf } from './renderer/pdf-generator.js';
import { QualityEngine } from './pipeline/grid.js';
import { PixelPatternOptimizer } from './pipeline/optimizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data', 'panda-render');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const config = generatePandaConfig();
  const rawGrid = generatePandaGrid();
  const bgColor = config.palette[config.palette.length - 1].hex;

  const optimizer = new PixelPatternOptimizer();
  const optimizedGrid = optimizer.optimize(rawGrid, bgColor, {
    targetSubjectRatio: 0.85,
    maxColors: 5,
  });
  // Force symmetry
  const grid = optimizedGrid.map((row, y) => {
    const cols = optimizedGrid[0].length;
    const mid = Math.floor(cols / 2);
    const out = [...row];
    for (let x = 0; x < mid; x++) {
      out[cols - 1 - x] = out[x];
    }
    return out;
  });

  const quality = new QualityEngine();
  const { score, reasons } = quality.evaluate(grid, bgColor);

  console.log(`QA score: ${score.toFixed(1)}/100`);
  if (score < 75) {
    console.log(`REJECTED: ${reasons.join(', ')}`);
  }

  const gridOutput = {
    grid,
    palette: config.palette.map((p) => ({ name: p.name, hex: p.hex })),
    score,
    rejected: score < 75,
    reasons,
  };

  const renderer = new BeadRenderer();
  const { cover, finished, thumbnail } = renderer.render(gridOutput, config.spec, 'Cute Panda');
  const gridPng = renderer.renderGrid(grid);
  const pdf = await generatePatternPdf({
    title: 'Cute Panda',
    grid,
    palette: gridOutput.palette,
    gridSize: `${grid[0].length}x${grid.length}`,
    beadCount: grid.flat().filter((c) => c !== bgColor).length,
    difficulty: 'Easy',
  });

  fs.writeFileSync(path.join(OUT_DIR, 'cover.png'), cover);
  fs.writeFileSync(path.join(OUT_DIR, 'finished.png'), finished);
  fs.writeFileSync(path.join(OUT_DIR, 'thumbnail.png'), thumbnail);
  fs.writeFileSync(path.join(OUT_DIR, 'grid.png'), gridPng);
  fs.writeFileSync(path.join(OUT_DIR, 'pattern.pdf'), pdf);
  fs.writeFileSync(path.join(OUT_DIR, 'colors.json'), JSON.stringify({
    used: Array.from(new Set(grid.flat())).map((hex) => ({
      hex,
      name: config.palette.find((p) => p.hex === hex)?.name || hex,
      count: grid.flat().filter((c) => c === hex).length,
    })),
  }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'grid.json'), JSON.stringify(grid));

  console.log('Output:', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
