import { createCanvas, CanvasRenderingContext2D, loadImage } from 'canvas';
import type { PatternConfig, GridOutput } from './types.js';

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

function mapToPalette(color: string, palette: string[]): string {
  let best = palette[0];
  let bestDist = Infinity;
  const target = hexToRgb(color);
  for (const c of palette) {
    const candidate = hexToRgb(c);
    const dist = Math.sqrt((target.r - candidate.r) ** 2 + (target.g - candidate.g) ** 2 + (target.b - candidate.b) ** 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best;
}

export async function svgToGrid(svg: string, config: PatternConfig): Promise<string[][]> {
  const size = config.spec.gridSize;
  const palette = config.palette.map((p) => p.hex);
  const bgColor = config.palette[config.palette.length - 1].hex;

  // Render SVG to a temporary canvas
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const img = await loadImage(svgDataUrl);
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 512, 512);

  const { data } = ctx.getImageData(0, 0, 512, 512);

  // Convert to grayscale silhouette
  const silhouette = new Array(512 * 512).fill(0);
  for (let i = 0; i < 512 * 512; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    silhouette[i] = a > 50 && luminance < 180 ? 1 : 0;
  }

  // Build grid by sampling silhouette
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(bgColor));
  const cellSize = 512 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let filled = 0;
      let samples = 0;
      const startX = Math.floor(x * cellSize);
      const endX = Math.floor((x + 1) * cellSize);
      const startY = Math.floor(y * cellSize);
      const endY = Math.floor((y + 1) * cellSize);

      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          samples++;
          if (silhouette[py * 512 + px]) filled++;
        }
      }

      if (samples > 0 && filled / samples > 0.45) {
        grid[y][x] = palette[0]; // Use outline/accent color
      }
    }
  }

  return grid;
}

export function fillSilhouetteWithColor(
  grid: string[][],
  silhouetteColor: string,
  fillColor: string,
  eyeColor: string
): string[][] {
  // Simple heuristic: fill enclosed areas, mark small dark spots as eyes
  const rows = grid.length;
  const cols = grid[0].length;
  const out = grid.map((row) => [...row]);

  // Find connected components of silhouette
  const visited = new Set<string>();
  const components: Array<{ cells: [number, number][]; boundingBox: { minX: number; maxX: number; minY: number; maxY: number } }> = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] !== silhouetteColor || visited.has(`${x},${y}`)) continue;
      const cells: [number, number][] = [];
      let minX = x, maxX = x, minY = y, maxY = y;
      const stack: [number, number][] = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) continue;
        if (grid[cy][cx] !== silhouetteColor || visited.has(`${cx},${cy}`)) continue;
        visited.add(`${cx},${cy}`);
        cells.push([cx, cy]);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
      components.push({ cells, boundingBox: { minX, maxX, minY, maxY } });
    }
  }

  // Largest component is the body fill
  const body = components.reduce((a, b) => (a.cells.length >= b.cells.length ? a : b), components[0]);
  if (!body) return out;

  for (const [cx, cy] of body.cells) {
    out[cy][cx] = fillColor;
  }

  // Small components become eyes (black)
  for (const comp of components) {
    if (comp === body) continue;
    if (comp.cells.length >= 2 && comp.cells.length <= 30) {
      for (const [cx, cy] of comp.cells) {
        out[cy][cx] = eyeColor;
      }
    }
  }

  return out;
}
