import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import type { VisualSpec, GridOutput, RenderOutput } from '../pipeline/types.js';

export interface RenderOptions {
  showGrid?: boolean;
  showTitle?: boolean;
  showLegend?: boolean;
  background?: string;
  beadSpacing?: number;
  margin?: number;
  boardColor?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
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

function isLight(r: number, g: number, b: number): boolean {
  return (r * 0.299 + g * 0.587 + b * 0.114) > 160;
}

export function drawBead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size * 0.48;
  const { r, g, b } = hexToRgb(color);
  const light = isLight(r, g, b);

  // 1. Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(centerX + size * 0.08, centerY + size * 0.1, radius * 0.95, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Bead body with radial gradient
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

  // 3. Central hole (peg hole)
  ctx.fillStyle = light ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.32 * 0.9, radius * 0.32 * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Highlight (top-left reflection)
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(centerX - radius * 0.3, centerY - radius * 0.35, radius * 0.2, radius * 0.14, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // 5. Edge rim light
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.88, radius * 0.78, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawBeadBoard(
  ctx: CanvasRenderingContext2D,
  grid: string[][],
  canvasSize: number,
  options: RenderOptions = {}
) {
  const {
    background = '#f0f0f0',
    boardColor = '#e8eaed',
    margin = 40,
  } = options;

  const rows = grid.length;
  const cols = grid[0].length;
  const maxDim = Math.max(cols, rows);
  const beadSize = Math.floor((canvasSize - margin * 2) / maxDim);
  const gridWidth = cols * beadSize;
  const gridHeight = rows * beadSize;
  const startX = (canvasSize - gridWidth) / 2;
  const startY = (canvasSize - gridHeight) / 2;

  // Background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Pegboard shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  roundRect(ctx, startX - 10 + 3, startY - 10 + 3, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();

  // Pegboard
  ctx.fillStyle = boardColor;
  roundRect(ctx, startX - 10, startY - 10, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();

  // Peg holes (subtle grid dots)
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

  return { beadSize, startX, startY, gridWidth, gridHeight };
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

export function renderCover(
  grid: string[][],
  palette: { name: string; hex: string }[],
  title: string,
  meta: { gridSize: string; beadCount: number; colorCount: number },
  options: RenderOptions = {}
): Buffer {
  const canvasSize = 1024;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');

  const boardInfo = drawBeadBoard(ctx, grid, canvasSize, { ...options, background: '#ffffff', margin: 120 });

  // Title
  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, canvasSize / 2, 36);

  // Meta
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText(`${meta.gridSize} Fuse Bead Pattern | ${meta.beadCount} beads | ${meta.colorCount} colors`, canvasSize / 2, 82);

  // Color palette legend
  const legendY = boardInfo.startY + boardInfo.gridHeight + 40;
  const swatchSize = 24;
  const maxPerRow = Math.floor((canvasSize - 80) / 160);
  const usedColors = Array.from(new Set(grid.flat()));
  const items = usedColors
    .map((hex) => ({ hex, name: palette.find((p) => p.hex === hex)?.name || hex.toUpperCase() }));

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#444';
  ctx.textAlign = 'left';
  ctx.fillText(`Color Palette (${items.length})`, 40, legendY - 6);

  for (let i = 0; i < items.length; i++) {
    const row = Math.floor(i / maxPerRow);
    const col = i % maxPerRow;
    const x = 40 + col * 160;
    const y = legendY + 18 + row * 38;
    drawBead(ctx, x, y, swatchSize, items[i].hex);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i].name, x + swatchSize + 8, y + swatchSize / 2);
  }

  return canvas.toBuffer('image/png');
}

export function renderFinished(
  grid: string[][],
  options: RenderOptions = {}
): Buffer {
  const canvasSize = 1024;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');
  const boardInfo = drawBeadBoard(ctx, grid, canvasSize, { ...options, background: '#1a1d2b', boardColor: '#23263a', margin: 60 });

  // Frame glow
  const gradient = ctx.createLinearGradient(boardInfo.startX, boardInfo.startY, boardInfo.startX + boardInfo.gridWidth, boardInfo.startY + boardInfo.gridHeight);
  gradient.addColorStop(0, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 5;
  ctx.strokeRect(boardInfo.startX - 12, boardInfo.startY - 12, boardInfo.gridWidth + 24, boardInfo.gridHeight + 24);

  return canvas.toBuffer('image/png');
}

export function renderThumbnail(
  grid: string[][],
  options: RenderOptions = {}
): Buffer {
  const canvasSize = 400;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');
  drawBeadBoard(ctx, grid, canvasSize, { ...options, background: '#ffffff', margin: 24 });
  return canvas.toBuffer('image/png');
}

export function renderGridPrint(
  grid: string[][],
  options: RenderOptions = {}
): Buffer {
  const canvasSize = 1600;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');
  const boardInfo = drawBeadBoard(ctx, grid, canvasSize, { ...options, background: '#ffffff', boardColor: '#f7f7f7', margin: 60 });

  // Draw grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  const { startX, startY, gridWidth, gridHeight, beadSize } = boardInfo;

  for (let x = 0; x <= grid[0].length; x++) {
    ctx.beginPath();
    ctx.moveTo(startX + x * beadSize, startY);
    ctx.lineTo(startX + x * beadSize, startY + gridHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= grid.length; y++) {
    ctx.beginPath();
    ctx.moveTo(startX, startY + y * beadSize);
    ctx.lineTo(startX + gridWidth, startY + y * beadSize);
    ctx.stroke();
  }

  return canvas.toBuffer('image/png');
}

export class BeadRenderer {
  render(gridOutput: GridOutput, spec: VisualSpec, title?: string): RenderOutput {
    const grid = gridOutput.grid;
    const palette = gridOutput.palette;
    const nonBgColors = new Set(grid.flat());
    const beadCount = grid.flat().filter((c) => c !== spec.background).length;

    return {
      cover: renderCover(grid, palette, title || 'Pattern', {
        gridSize: `${grid[0].length}x${grid.length}`,
        beadCount,
        colorCount: nonBgColors.size,
      }),
      finished: renderFinished(grid),
      thumbnail: renderThumbnail(grid),
    };
  }

  renderGrid(grid: string[][], options?: RenderOptions): Buffer {
    return renderGridPrint(grid, options);
  }
}
