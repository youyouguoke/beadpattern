import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePandaConfig, generatePandaGrid } from './pipeline/panda-test.js';
import { QualityEngine } from './pipeline/grid.js';
import { TemplateRenderer } from './pipeline/render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'data');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const config = generatePandaConfig();
  const grid = generatePandaGrid();
  const bgColor = config.palette[config.palette.length - 1].hex;
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

  const renderer = new TemplateRenderer();
  const { cover, finished, thumbnail } = renderer.render(gridOutput, config.spec, config.subject);

  fs.writeFileSync(path.join(OUT_DIR, 'panda-test-cover.png'), cover);
  fs.writeFileSync(path.join(OUT_DIR, 'panda-test-finished.png'), finished);
  fs.writeFileSync(path.join(OUT_DIR, 'panda-test-thumbnail.png'), thumbnail);
  fs.writeFileSync(path.join(OUT_DIR, 'panda-test-grid.json'), JSON.stringify(grid));

  console.log('Saved to', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
