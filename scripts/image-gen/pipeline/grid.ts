import type { PatternConfig, GridOutput } from './types.js';

export interface GridGenerator {
  generate(config: PatternConfig): Promise<GridOutput>;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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
    if (y < mid) return row;
    return [...grid[rows - 1 - y]];
  });
}

function detectEdgeTouch(grid: string[][], bgColor: string): boolean {
  const lastRow = grid.length - 1;
  const lastCol = grid[0].length - 1;
  for (let x = 0; x <= lastCol; x++) {
    if (grid[0][x] !== bgColor || grid[lastRow][x] !== bgColor) return true;
  }
  for (let y = 0; y <= lastRow; y++) {
    if (grid[y][0] !== bgColor || grid[y][lastCol] !== bgColor) return true;
  }
  return false;
}

function connectedComponents(grid: string[][], ignoreColor: string): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  let components = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === ignoreColor || visited.has(`${x},${y}`)) continue;
      components++;
      const stack: [number, number][] = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) continue;
        if (grid[cy][cx] === ignoreColor || visited.has(`${cx},${cy}`)) continue;
        visited.add(`${cx},${cy}`);
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
    }
  }
  return components;
}

function calculateSymmetryScore(grid: string[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let verticalMatches = 0;
  let total = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols / 2; x++) {
      total++;
      if (grid[y][x] === grid[y][cols - 1 - x]) verticalMatches++;
    }
  }
  return total > 0 ? verticalMatches / total : 0;
}

function calculateContrastScore(grid: string[][], bgColor: string): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const colors = new Set<string>();
  let bgNeighbors = 0;
  let total = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      colors.add(grid[y][x]);
      if (grid[y][x] === bgColor) continue;
      total++;
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === bgColor) {
          bgNeighbors++;
          break;
        }
      }
    }
  }

  const colorScore = Math.min(1, colors.size / 3);
  const edgeScore = total > 0 ? bgNeighbors / total : 0;
  return colorScore * 0.5 + edgeScore * 0.5;
}

function removeTinyIslands(grid: string[][], bgColor: string, minSize = 3): string[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const out = grid.map((row) => [...row]);

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

export class GridOptimizer {
  optimize(grid: string[][], bgColor: string): string[][] {
    let out = grid.map((row) => [...row]);
    out = removeTinyIslands(out, bgColor, 3);
    return out;
  }
}

function calculateDensityScore(grid: string[][], bgColor: string): number {
  const total = grid.length * grid[0].length;
  const nonBg = grid.flat().filter((c) => c !== bgColor).length;
  const ratio = nonBg / total;
  if (ratio < 0.15) return 0;
  if (ratio > 0.75) return 25;
  return ratio * 33.3;
}

function calculateColorScore(grid: string[][], _bgColor: string): number {
  const colors = new Set(grid.flat());
  const count = colors.size;
  if (count < 2) return 0;
  if (count < 4) return count * 5;
  if (count <= 8) return 20;
  return 15;
}

function calculateCraftabilityScore(grid: string[][], bgColor: string): number {
  let score = 25;
  if (detectEdgeTouch(grid, bgColor)) score -= 10;
  const components = connectedComponents(grid, bgColor);
  if (components > 5) score -= 5;
  if (components > 10) score -= 5;
  const total = grid.length * grid[0].length;
  const nonBg = grid.flat().filter((c) => c !== bgColor).length;
  if (nonBg / total > 0.85) score -= 5;
  return clamp(score, 0, 25);
}

function calculateShapeScore(grid: string[][], bgColor: string): number {
  const total = grid.length * grid[0].length;
  const nonBg = grid.flat().filter((c) => c !== bgColor).length;
  const density = nonBg / total;
  if (density < 0.15) return 5;
  let score = clamp(density * 40, 0, 20);
  // Slightly prefer patterns that don't touch edge too much
  if (!detectEdgeTouch(grid, bgColor)) score += 5;
  // Reward connected main shape
  const components = connectedComponents(grid, bgColor);
  if (components <= 3) score += 5;
  return clamp(score, 0, 30);
}

function calculateDetailScore(grid: string[][], bgColor: string): number {
  const colors = new Set(grid.flat());
  let score = clamp((colors.size - 1) * 2, 0, 6);
  // Reward internal color changes (not just edge)
  const rows = grid.length;
  const cols = grid[0].length;
  let internalTransitions = 0;
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[y][x] !== bgColor && grid[y][x] !== grid[y][x - 1]) internalTransitions++;
    }
  }
  score += clamp(internalTransitions / 50, 0, 4);
  return clamp(score, 0, 10);
}

export class QualityEngine {
  evaluate(grid: string[][], bgColor: string): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const shape = calculateShapeScore(grid, bgColor);
    const craftability = calculateCraftabilityScore(grid, bgColor);
    const color = calculateColorScore(grid, bgColor);
    const symmetry = calculateSymmetryScore(grid) * 15;
    const detail = calculateDetailScore(grid, bgColor);

    if (shape < 15) reasons.push('Low shape clarity');
    if (craftability < 15) reasons.push('Craftability concerns');
    if (color < 10) reasons.push('Weak color usage');
    if (symmetry < 10) reasons.push('Low symmetry');
    if (detail < 5) reasons.push('Low detail');

    const total = clamp(shape + craftability + color + symmetry + detail, 0, 100);
    return { score: total, reasons };
  }

  evaluateDetailed(grid: string[][], bgColor: string) {
    const shape = calculateShapeScore(grid, bgColor);
    const craftability = calculateCraftabilityScore(grid, bgColor);
    const color = calculateColorScore(grid, bgColor);
    const symmetry = calculateSymmetryScore(grid) * 15;
    const detail = calculateDetailScore(grid, bgColor);
    const total = clamp(shape + craftability + color + symmetry + detail, 0, 100);
    return {
      shape,
      craftability,
      color,
      symmetry,
      detail,
      total,
      reasons: total >= 80 ? [] : ['Quality score below threshold'],
    };
  }
}

export class FallbackGridGenerator implements GridGenerator {
  private optimizer = new GridOptimizer();
  private quality = new QualityEngine();

  async generate(config: PatternConfig): Promise<GridOutput> {
    const { spec, palette } = config;
    const size = spec.gridSize;
    const bgColor = palette[palette.length - 1].hex;
    const mainColor = palette[1].hex;
    const accentColor = palette[0].hex;

    let grid: string[][] = Array.from({ length: size }, () => Array(size).fill(bgColor));
    const center = size / 2;
    const radius = size * 0.44;
    const margin = spec.margin;

    for (let y = margin; y < size - margin; y++) {
      for (let x = margin; x < size - margin; x++) {
        const dx = x - center + 0.5;
        const dy = y - center + 0.5;
        if (dx * dx + dy * dy < radius * radius) {
          grid[y][x] = mainColor;
        }
      }
    }

    const eyeY = Math.floor(size * 0.44);
    const leftEyeX = Math.floor(size * 0.38);
    const rightEyeX = Math.floor(size * 0.62);
    if (eyeY >= 0 && eyeY < size) {
      if (leftEyeX >= 0 && leftEyeX < size) grid[eyeY][leftEyeX] = accentColor;
      if (rightEyeX >= 0 && rightEyeX < size) grid[eyeY][rightEyeX] = accentColor;
    }

    if (config.slug.includes('frog') && config.subject.includes('prince')) {
      const crownY = Math.floor(size * 0.24);
      for (let x = Math.floor(size * 0.34); x <= Math.floor(size * 0.66); x++) {
        if (crownY >= 0 && crownY < size) grid[crownY][x] = '#fbc02d';
      }
      const crownY2 = Math.floor(size * 0.28);
      for (let x = Math.floor(size * 0.36); x <= Math.floor(size * 0.64); x++) {
        if (crownY2 >= 0 && crownY2 < size) grid[crownY2][x] = '#fbc02d';
      }
    }

    if (spec.symmetry === 'vertical') grid = ensureVerticalSymmetry(grid);
    else if (spec.symmetry === 'horizontal') grid = ensureHorizontalSymmetry(grid);

    const optimized = this.optimizer.optimize(grid, bgColor);
    const { score, reasons } = this.quality.evaluate(optimized, bgColor);

    return {
      grid: optimized,
      palette: palette.map((p) => ({ name: p.name, hex: p.hex })),
      score,
      rejected: score < 75,
      reasons,
    };
  }
}
