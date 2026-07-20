import { DslGridGenerator, dslToPalette } from './pipeline/grid-generator.js';
import { GridOptimizer, QualityEngine } from './pipeline/grid.js';
import type { PatternDSL } from './pipeline/types.js';

function runFor(subject: string) {
  const dsl: PatternDSL = {
    subject,
    features: ['cute', 'centered'],
    style: 'cute',
    symmetry: 'vertical',
    composition: 'center',
    outline: 'strong',
    maxColors: 5,
    background: '#ffffff',
    gridSize: 29,
    margin: 2,
  };
  const palette = dslToPalette(dsl);
  const generator = new DslGridGenerator();
  const { grid, layers } = generator.generate({ dsl, palette });
  const optimized = new GridOptimizer().optimize(grid, dsl.background);
  const q = new QualityEngine().evaluateDetailed(optimized, dsl.background);
  console.log(subject, 'score', q.total, 'colors', new Set(optimized.flat()).size, 'layers', layers.length);
  console.log('  shape:', q.shape, 'craftability:', q.craftability, 'color:', q.color, 'symmetry:', q.symmetry, 'detail:', q.detail);
  console.log('  palette:', palette);
  return q;
}

for (const s of ['panda', 'mushroom', 'flower', 'cat', 'star', 'heart', 'ghost', 'pumpkin', 'rainbow', 'smiley', 'bunny']) {
  runFor(s);
}
