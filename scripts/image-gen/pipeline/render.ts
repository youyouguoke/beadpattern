import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import type { VisualSpec, GridOutput, RenderOutput } from './types.js';

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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size * 0.42;
  const { r, g, b } = hexToRgb(color);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(centerX + 1, centerY + 2, radius * 0.95, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body gradient
  const gradient = ctx.createRadialGradient(
    centerX - radius * 0.35,
    centerY - radius * 0.35,
    radius * 0.15,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, `rgb(${Math.min(255, r + 55)}, ${Math.min(255, g + 55)}, ${Math.min(255, b + 55)})`);
  gradient.addColorStop(0.45, `rgb(${r}, ${g}, ${b})`);
  gradient.addColorStop(1, `rgb(${Math.max(0, r - 45)}, ${Math.max(0, g - 45)}, ${Math.max(0, b - 45)})`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.95, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hole
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.28 * 0.9, radius * 0.28 * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(centerX - radius * 0.3, centerY - radius * 0.35, radius * 0.18, radius * 0.12, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[][],
  spec: VisualSpec,
  canvasSize: number,
  showLegend: boolean,
  title?: string
) {
  const rows = grid.length;
  const cols = grid[0].length;
  const maxDim = Math.max(cols, rows);
  const padding = spec.padding + 40; // extra for title and legend
  const beadSize = Math.floor((canvasSize - padding * 2) / maxDim);
  const gridWidth = cols * beadSize;
  const gridHeight = rows * beadSize;
  const startX = (canvasSize - gridWidth) / 2;
  const startY = (canvasSize - gridHeight) / 2 - 20;
  const bgColor = spec.background;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Title
  if (title) {
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, canvasSize / 2, 24);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`${cols}×${rows} Fuse Bead Pattern`, canvasSize / 2, 62);
  }

  // Pegboard shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  roundRect(ctx, startX - 10 + 3, startY - 10 + 3, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();
  ctx.fillStyle = '#e8eaed';
  roundRect(ctx, startX - 10, startY - 10, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();

  // Peg holes
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  const pegSize = Math.max(1, beadSize * 0.1);
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.arc(startX + x * beadSize, startY + y * beadSize, pegSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Beads
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      drawBead(ctx, startX + x * beadSize, startY + y * beadSize, beadSize, grid[y][x]);
    }
  }

  // Legend
  if (showLegend) {
    const usedColors = new Set(grid.flat());
    const items = Array.from(usedColors).map((hex) => ({ hex, name: hex.toUpperCase() }));
    const legendY = startY + gridHeight + 32;
    const swatchSize = 18;
    const maxPerRow = Math.floor((canvasSize - 80) / 140);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'left';
    ctx.fillText(`Color Palette (${items.length})`, 40, legendY - 6);

    for (let i = 0; i < items.length; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const x = 40 + col * 140;
      const y = legendY + 18 + row * 34;
      drawBead(ctx, x, y, swatchSize, items[i].hex);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#555';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(items[i].name, x + swatchSize + 8, y + swatchSize / 2);
    }
  }
}

export class TemplateRenderer {
  render(gridOutput: GridOutput, spec: VisualSpec, title?: string): RenderOutput {
    const grid = gridOutput.grid;

    // Cover: 1024x1024 with title and legend
    const coverCanvas = createCanvas(1024, 1024);
    const coverCtx = coverCanvas.getContext('2d');
    drawGrid(coverCtx, grid, spec, 1024, true, title);

    // Finished: 1024x1024 without title/legend, light pegboard style
    const finishedCanvas = createCanvas(1024, 1024);
    const finishedCtx = finishedCanvas.getContext('2d');
    drawGrid(finishedCtx, grid, { ...spec, background: '#f5f5f5', padding: 60 }, 1024, false, undefined);
    // Finished frame glow
    const rows = grid.length;
    const cols = grid[0].length;
    const maxDim = Math.max(cols, rows);
    const padding = 80 + 40;
    const beadSize = Math.floor((1024 - padding * 2) / maxDim);
    const gridWidth = cols * beadSize;
    const gridHeight = rows * beadSize;
    const startX = (1024 - gridWidth) / 2;
    const startY = (1024 - gridHeight) / 2 - 20;
    const gradient = finishedCtx.createLinearGradient(startX, startY, startX + gridWidth, startY + gridHeight);
    gradient.addColorStop(0, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,0.08)');
    finishedCtx.strokeStyle = gradient;
    finishedCtx.lineWidth = 5;
    finishedCtx.strokeRect(startX - 12, startY - 12, gridWidth + 24, gridHeight + 24);

    // Thumbnail: 400x400
    const thumbnailCanvas = createCanvas(400, 400);
    const thumbnailCtx = thumbnailCanvas.getContext('2d');
    drawGrid(thumbnailCtx, grid, { ...spec, padding: 24 }, 400, false, undefined);

    return {
      cover: coverCanvas.toBuffer('image/png'),
      finished: finishedCanvas.toBuffer('image/png'),
      thumbnail: thumbnailCanvas.toBuffer('image/png'),
    };
  }
}
