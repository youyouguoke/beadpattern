import { KimiShapeGenerator, ShapeDescription } from './kimi.js';
import type { PatternConfig, GridOutput } from './types.js';
import { GridOptimizer, QualityEngine } from './grid.js';

function fillShape(grid: string[][], shape: ShapeDescription['shapes'][0], bgColor: string): string[][] {
  const out = grid.map((row) => [...row]);

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      let inside = false;
      if (shape.type === 'circle') {
        const r = shape.r || 1;
        const dx = x - shape.x;
        const dy = y - shape.y;
        inside = dx * dx + dy * dy <= r * r;
      } else if (shape.type === 'ellipse') {
        const rx = shape.rx || 1;
        const ry = shape.ry || 1;
        const dx = x - shape.x;
        const dy = y - shape.y;
        inside = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
      }
      if (inside) {
        out[y][x] = shape.color;
      }
    }
  }

  return out;
}

export function renderShapeDescription(desc: ShapeDescription, bgColor: string): string[][] {
  const size = desc.grid_size;
  let grid: string[][] = Array.from({ length: size }, () => Array(size).fill(bgColor));

  for (const shape of desc.shapes) {
    grid = fillShape(grid, shape, bgColor);
  }

  return grid;
}

function ensureVerticalSymmetry(grid: string[][]): string[][] {
  const cols = grid[0].length;
  const mid = Math.floor(cols / 2);
  return grid.map((row) => {
    const out = [...row];
    for (let x = 0; x < mid; x++) {
      out[cols - 1 - x] = out[x];
    }
    return out;
  });
}

export class ShapeBasedGridGenerator {
  private kimi: KimiShapeGenerator;
  private optimizer: GridOptimizer;
  private quality: QualityEngine;

  constructor(kimi: KimiShapeGenerator) {
    this.kimi = kimi;
    this.optimizer = new GridOptimizer();
    this.quality = new QualityEngine();
  }

  async generate(config: PatternConfig, onShapeDesc?: (desc: ShapeDescription) => void): Promise<GridOutput> {
    const desc = await this.kimi.generateShapeDescription(config.subject, config.spec.gridSize);
    if (onShapeDesc) onShapeDesc(desc);
    const bgColor = desc.background || config.palette[config.palette.length - 1].hex;
    let grid = renderShapeDescription(desc, bgColor);

    if (config.spec.symmetry === 'vertical') {
      grid = ensureVerticalSymmetry(grid);
    }

    const optimized = this.optimizer.optimize(grid, bgColor);
    const { score, reasons } = this.quality.evaluate(optimized, bgColor);

    return {
      grid: optimized,
      palette: config.palette.map((p) => ({ name: p.name, hex: p.hex })),
      score,
      rejected: score < 75,
      reasons,
    };
  }
}
