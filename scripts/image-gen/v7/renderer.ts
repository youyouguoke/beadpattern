import { createCanvas } from 'canvas';
import type { Palette } from './types.js';

export function renderGrid(grid: number[][], palette: Palette, options: { beadSize?: number; gap?: number; bgColor?: string; silhouette?: boolean } = {}) {
  const beadSize = options.beadSize ?? 10;
  const gap = options.gap ?? 1;
  const bgColor = options.bgColor ?? '#ffffff';
  const silhouette = options.silhouette ?? false;
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
      } else if (silhouette) {
        ctx.fillStyle = '#1a1a1a';
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
