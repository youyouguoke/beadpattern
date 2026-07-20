import type { ShapeContext, ShapeLayer, ShapeDefinition } from '../dsl/types.js';

export function createMask(size: number, fill = false): boolean[][] {
  return Array.from({ length: size }, () => Array(size).fill(fill));
}

export function copyMask(mask: boolean[][]): boolean[][] {
  return mask.map((row) => [...row]);
}

export function drawCircle(mask: boolean[][], cx: number, cy: number, radius: number, value = true): boolean[][] {
  const size = mask.length;
  const out = copyMask(mask);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      if (dx * dx + dy * dy <= radius * radius) out[y][x] = value;
    }
  }
  return out;
}

export function drawEllipse(mask: boolean[][], cx: number, cy: number, rx: number, ry: number, value = true): boolean[][] {
  const size = mask.length;
  const out = copyMask(mask);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) out[y][x] = value;
    }
  }
  return out;
}

export function drawRoundedRect(mask: boolean[][], x: number, y: number, w: number, h: number, r: number, value = true): boolean[][] {
  const size = mask.length;
  const out = copyMask(mask);
  const cx = x + w / 2;
  const cy = y + h / 2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = Math.abs(px + 0.5 - cx) - (w / 2 - r);
      const dy = Math.abs(py + 0.5 - cy) - (h / 2 - r);
      let dist;
      if (dx > 0 && dy > 0) dist = Math.sqrt(dx * dx + dy * dy);
      else dist = Math.max(dx, dy);
      if (dist <= r) out[py][px] = value;
    }
  }
  return out;
}

export function applySymmetry(mask: boolean[][], symmetry: 'vertical' | 'horizontal' | 'none'): boolean[][] {
  if (symmetry === 'none') return mask;
  const size = mask.length;
  const out = copyMask(mask);
  if (symmetry === 'vertical') {
    const mid = Math.floor(size / 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < mid; x++) {
        out[y][size - 1 - x] = out[y][x];
      }
    }
  } else if (symmetry === 'horizontal') {
    const mid = Math.floor(size / 2);
    for (let y = 0; y < mid; y++) {
      for (let x = 0; x < size; x++) {
        out[size - 1 - y][x] = out[y][x];
      }
    }
  }
  return out;
}

export function composeLayers(layers: ShapeLayer[], size: number, background: string): string[][] {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(background));
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  for (const layer of sorted) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (layer.mask[y][x]) grid[y][x] = layer.color;
      }
    }
  }
  return grid;
}

export function createShapeLayer(ctx: ShapeContext, mask: boolean[][], type: 'body' | 'detail' | 'outline' | 'highlight', colorIndex: number, id: string): ShapeLayer {
  return {
    id,
    type,
    color: ctx.palette[colorIndex % ctx.palette.length],
    mask,
    zIndex: type === 'body' ? 0 : type === 'outline' ? 10 : type === 'detail' ? 5 : 8,
  };
}

export class ShapeRegistry {
  private shapes: ShapeDefinition[] = [];

  register(...defs: ShapeDefinition[]) {
    this.shapes.push(...defs);
  }

  find(subject: string, features: string[]): ShapeDefinition[] {
    const query = [subject, ...features].map((s) => s.toLowerCase());
    return this.shapes.filter((shape) =>
      shape.tags.some((tag) => query.includes(tag.toLowerCase()))
    );
  }

  getShape(name: string): ShapeDefinition | undefined {
    return this.shapes.find((s) => s.name.toLowerCase() === name.toLowerCase());
  }
}

export const registry = new ShapeRegistry();
