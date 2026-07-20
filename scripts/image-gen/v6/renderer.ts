import { createCanvas } from 'canvas';
import type { Palette } from './types.js';

export function renderGrid(grid: number[][], palette: Palette, options: { beadSize?: number; gap?: number; bgColor?: string } = {}) {
  const beadSize = options.beadSize ?? 10;
  const gap = options.gap ?? 1;
  const bgColor = options.bgColor ?? '#ffffff';
  const rows = grid.length;
  const cols = grid[0].length;
  const width = cols * (beadSize + gap) + gap;
  const height = rows * (beadSize + gap) + gap;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const colorIndex = grid[y][x];
      const px = gap + x * (beadSize + gap);
      const py = gap + y * (beadSize + gap);
      if (colorIndex === 0) {
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(px, py, beadSize, beadSize);
      } else {
        const swatch = palette.swatches[colorIndex - 1];
        ctx.fillStyle = swatch ? swatch.hex : '#000000';
        ctx.fillRect(px, py, beadSize, beadSize);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(px, py, beadSize, Math.floor(beadSize / 3));
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(px, py + beadSize - Math.floor(beadSize / 3), beadSize, Math.floor(beadSize / 3));
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(px + beadSize - 1, py, 1, beadSize);
        ctx.fillRect(px, py + beadSize - 1, beadSize, 1);
      }
    }
  }

  return canvas;
}

export function canvasToPngBuffer(canvas: any): Buffer {
  return canvas.toBuffer('image/png');
}

export function gridToSvg(grid: number[][], palette: Palette, cellSize = 12): string {
  const rows = grid.length;
  const cols = grid[0].length;
  const width = cols * cellSize;
  const height = rows * cellSize;
  let svg = `\u003csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"\u003e\n`;
  svg += `\u003crect width="100%" height="100%" fill="#fafafa" /\u003e\n`;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const colorIndex = grid[y][x];
      if (colorIndex === 0) continue;
      const swatch = palette.swatches[colorIndex - 1];
      svg += `\u003crect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${swatch.hex}" stroke="rgba(0,0,0,0.06)" stroke-width="1" /\u003e\n`;
    }
  }
  svg += '\u003c/svg\u003e';
  return svg;
}
