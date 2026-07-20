import { GridOptimizer, QualityEngine } from './grid.js';
import type { PatternConfig, GridOutput } from './types.js';

export type OptimizationStep =
  | 'bbox-normalize'
  | 'symmetry'
  | 'moore-smooth'
  | 'remove-noise'
  | 'color-reduce';

export interface OptimizerOptions {
  steps?: OptimizationStep[];
  minSubjectRatio?: number;
  targetSubjectRatio?: number;
  maxColors?: number;
}

function clone(grid: string[][]): string[][] {
  return grid.map((row) => [...row]);
}

function getBoundingBox(grid: string[][], bgColor: string): { x: number; y: number; w: number; h: number } {
  let minX = grid[0].length;
  let maxX = -1;
  let minY = grid.length;
  let maxY = -1;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] !== bgColor) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function normalizeBoundingBox(grid: string[][], bgColor: string, targetRatio = 0.75): string[][] {
  const size = grid.length;
  const bbox = getBoundingBox(grid, bgColor);
  if (bbox.w === 0 || bbox.h === 0) return grid;

  // Compute scale to fit target ratio while preserving aspect ratio
  const subjectRatio = Math.max(bbox.w / size, bbox.h / size);
  const scale = targetRatio / subjectRatio;
  const clampedScale = Math.min(scale, 1.5); // allow up to 1.5x upscaling
  if (clampedScale >= 1.0 || clampedScale <= 0.9) {
    const scaled: string[][] = Array.from({ length: size }, () => Array(size).fill(bgColor));
    const newW = Math.min(size, Math.floor(bbox.w * clampedScale));
    const newH = Math.min(size, Math.floor(bbox.h * clampedScale));
    const offsetX = Math.floor((size - newW) / 2);
    const offsetY = Math.floor((size - newH) / 2);

    for (let y = 0; y < newH; y++) {
      for (let x = 0; x < newW; x++) {
        const srcX = bbox.x + Math.floor((x * bbox.w) / newW);
        const srcY = bbox.y + Math.floor((y * bbox.h) / newH);
        if (srcY < grid.length && srcX < grid[0].length) {
          scaled[offsetY + y][offsetX + x] = grid[srcY][srcX];
        }
      }
    }
    return scaled;
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

function ensureHorizontalSymmetry(grid: string[][]): string[][] {
  const rows = grid.length;
  const mid = Math.floor(rows / 2);
  return grid.map((row, y) => {
    if (y <= mid) return row;
    return [...grid[rows - 1 - y]];
  });
}

function mooreSmoothing(grid: string[][], bgColor: string): string[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const out = clone(grid);

  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const color = grid[y][x];
      if (color === bgColor) continue;

      let sameColorNeighbors = 0;
      let anyColorNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (grid[ny][nx] !== bgColor) {
            anyColorNeighbors++;
            if (grid[ny][nx] === color) sameColorNeighbors++;
          }
        }
      }

      // If isolated or nearly isolated, fill with dominant neighbor
      if (anyColorNeighbors <= 2) {
        const counts: Record<string, number> = {};
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const c = grid[y + dy][x + dx];
            if (c !== bgColor) {
              counts[c] = (counts[c] || 0) + 1;
            }
          }
        }
        const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (dominant) out[y][x] = dominant[0];
      }
      // If surrounded by same color, keep
    }
  }
  return out;
}

function removeNoise(grid: string[][], bgColor: string, minSize = 3): string[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const out = clone(grid);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid[y][x];
      if (color === bgColor || visited.has(`${x},${y}`)) continue;
      const cells: [number, number][] = [];
      const stack: [number, number][] = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) continue;
        if (grid[cy][cx] !== color || visited.has(`${cx},${cy}`)) continue;
        visited.add(`${cx},${cy}`);
        cells.push([cx, cy]);
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
      if (cells.length < minSize) {
        for (const [cx, cy] of cells) {
          out[cy][cx] = bgColor;
        }
      }
    }
  }
  return out;
}

function kMeansColorReduce(grid: string[][], bgColor: string, maxColors: number): string[][] {
  const colors = Array.from(new Set(grid.flat())).filter((c) => c !== bgColor);
  if (colors.length <= maxColors) return grid;

  // Simple color reduction: sort by frequency and merge rarest colors
  const counts: Record<string, number> = {};
  for (const c of grid.flat()) {
    if (c !== bgColor) counts[c] = (counts[c] || 0) + 1;
  }
  const sorted = colors.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  const keep = new Set(sorted.slice(0, maxColors));

  // For removed colors, find nearest kept color in RGB distance
  function colorDistance(a: string, b: string): number {
    const aRgb = hexToRgb(a);
    const bRgb = hexToRgb(b);
    return Math.abs(aRgb.r - bRgb.r) + Math.abs(aRgb.g - bRgb.g) + Math.abs(aRgb.b - bRgb.b);
  }

  const out = clone(grid);
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const c = grid[y][x];
      if (c === bgColor || keep.has(c)) continue;
      let nearest = sorted[0];
      let best = Infinity;
      for (const k of Array.from(keep)) {
        const d = colorDistance(c, k);
        if (d < best) {
          best = d;
          nearest = k;
        }
      }
      out[y][x] = nearest;
    }
  }
  return out;
}

function hexToRgb(hex: string) {
  const h = hex.toLowerCase().trim();
  let r = 0, g = 0, b = 0;
  if (h.length === 4 && h[0] === '#') {
    r = parseInt(h[1] + h[1], 16);
    g = parseInt(h[2] + h[2], 16);
    b = parseInt(h[3] + h[3], 16);
  } else if (h.length === 7 && h[0] === '#') {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  }
  return { r, g, b };
}

export class PixelPatternOptimizer {
  private optimizer = new GridOptimizer();
  private quality = new QualityEngine();

  optimize(grid: string[][], bgColor: string, options: OptimizerOptions = {}): string[][] {
    const steps = options.steps || ['bbox-normalize', 'symmetry', 'moore-smooth', 'remove-noise', 'color-reduce'];
    let out = clone(grid);

    if (steps.includes('bbox-normalize')) {
      out = normalizeBoundingBox(out, bgColor, options.targetSubjectRatio || 0.75);
    }
    if (steps.includes('symmetry')) {
      out = ensureVerticalSymmetry(out);
    }
    if (steps.includes('remove-noise')) {
      out = removeNoise(out, bgColor, 3);
    }
    if (steps.includes('moore-smooth')) {
      out = mooreSmoothing(out, bgColor);
    }
    if (steps.includes('color-reduce')) {
      out = kMeansColorReduce(out, bgColor, options.maxColors || 6);
    }
    // Final cleanup
    out = this.optimizer.optimize(out, bgColor);
    return out;
  }

  evaluate(grid: string[][], bgColor: string): { score: number; reasons: string[] } {
    return this.quality.evaluate(grid, bgColor);
  }

  async generateOptimized(config: PatternConfig, generateGrid: (c: PatternConfig) => Promise<string[][]>): Promise<GridOutput> {
    const bgColor = config.palette[config.palette.length - 1].hex;
    let best: string[][] | null = null;
    let bestScore = 0;
    let bestReasons: string[] = [];

    // Try a few variations to get above threshold
    for (let attempt = 0; attempt < 3; attempt++) {
      const raw = await generateGrid({ ...config, slug: `${config.slug}-${attempt}` });
      let optimized = this.optimize(raw, bgColor, {
        targetSubjectRatio: 0.7,
        maxColors: config.spec.maxColors || 6,
      });
      if (config.spec.symmetry === 'vertical') {
        optimized = ensureVerticalSymmetry(optimized);
      } else if (config.spec.symmetry === 'horizontal') {
        optimized = ensureHorizontalSymmetry(optimized);
      }
      const { score, reasons } = this.quality.evaluate(optimized, bgColor);
      if (score > bestScore) {
        bestScore = score;
        best = optimized;
        bestReasons = reasons;
      }
      if (score >= 85) break;
    }

    return {
      grid: best || [],
      palette: config.palette.map((p) => ({ name: p.name, hex: p.hex })),
      score: bestScore,
      rejected: bestScore < 75,
      reasons: bestReasons,
    };
  }
}
