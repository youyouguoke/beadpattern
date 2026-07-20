import { DslGridGenerator, dslToPalette } from './pipeline/grid-generator.js';
import { GridOptimizer, QualityEngine } from './pipeline/grid.js';
import { AssetGenerator } from './renderer/asset-generator.js';
import type { PatternDSL, GridOutput } from './pipeline/types.js';
import * as fs from 'fs';

const dsl: PatternDSL = {
  subject: 'panda',
  features: ['round_face', 'black_eye_patch', 'small_body'],
  style: 'cute',
  symmetry: 'vertical',
  composition: 'center',
  outline: 'strong',
  maxColors: 5,
  background: '#fefefe',
  gridSize: 29,
  margin: 2,
};

async function main() {
  const palette = dslToPalette(dsl);
  const generator = new DslGridGenerator();
  const { grid, layers } = generator.generate({ dsl, palette });

  const optimizer = new GridOptimizer();
  const optimized = optimizer.optimize(grid, dsl.background);

  const qualityEngine = new QualityEngine();
  const quality = qualityEngine.evaluateDetailed(optimized, dsl.background);
  const simple = qualityEngine.evaluate(optimized, dsl.background);

  const gridOutput: GridOutput = {
    grid: optimized,
    palette: palette.map((hex) => ({ name: hex, hex })),
    score: quality.total,
    rejected: quality.total < 80,
    reasons: quality.reasons,
    quality,
    layers,
  };

  console.log('Quality (5D):', quality);
  console.log('Legacy score:', simple.score, simple.reasons);
  console.log('Colors used:', Array.from(new Set(optimized.flat())).length);
  console.log('Bead count:', optimized.flat().filter((c) => c !== dsl.background).length);

  const assetGenerator = new AssetGenerator();
  const assets = await assetGenerator.generate({ gridOutput, title: 'Cute Panda', dsl });

  fs.mkdirSync('./data/dsl-test', { recursive: true });
  fs.writeFileSync('./data/dsl-test/cover.png', assets.cover);
  fs.writeFileSync('./data/dsl-test/preview.png', assets.preview);
  fs.writeFileSync('./data/dsl-test/thumbnail.png', assets.thumbnail);
  fs.writeFileSync('./data/dsl-test/printable.png', assets.printable);
  fs.writeFileSync('./data/dsl-test/pattern.pdf', assets.pdf);
  fs.writeFileSync('./data/dsl-test/metadata.json', JSON.stringify(assets.metadata, null, 2));

  console.log('Assets written to ./data/dsl-test');
}

main().catch(console.error);
