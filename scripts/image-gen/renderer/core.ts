import { createCanvas, CanvasRenderingContext2D } from 'canvas';

export interface RenderOptions {
  showGrid?: boolean;
  showTitle?: boolean;
  showLegend?: boolean;
  background?: string;
  boardColor?: string;
  margin?: number;
  beadSpacing?: number;
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

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(centerX + size * 0.08, centerY + size * 0.1, radius * 0.95, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.fillStyle = light ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.32 * 0.9, radius * 0.32 * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(centerX - radius * 0.3, centerY - radius * 0.35, radius * 0.2, radius * 0.14, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.88, radius * 0.78, 0, 0, Math.PI * 2);
  ctx.stroke();
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

export interface BoardInfo {
  beadSize: number;
  startX: number;
  startY: number;
  gridWidth: number;
  gridHeight: number;
}

export function drawBeadBoard(
  ctx: CanvasRenderingContext2D,
  grid: string[][],
  canvasSize: number,
  options: RenderOptions = {}
): BoardInfo {
  const { background = '#f0f0f0', boardColor = '#e8eaed', margin = 40 } = options;
  const rows = grid.length;
  const cols = grid[0].length;
  const maxDim = Math.max(cols, rows);
  const beadSize = Math.floor((canvasSize - margin * 2) / maxDim);
  const gridWidth = cols * beadSize;
  const gridHeight = rows * beadSize;
  const startX = (canvasSize - gridWidth) / 2;
  const startY = (canvasSize - gridHeight) / 2;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  roundRect(ctx, startX - 10 + 3, startY - 10 + 3, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();

  ctx.fillStyle = boardColor;
  roundRect(ctx, startX - 10, startY - 10, gridWidth + 20, gridHeight + 20, 8);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  const pegSize = Math.max(1, beadSize * 0.1);
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.arc(startX + x * beadSize, startY + y * beadSize, pegSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      drawBead(ctx, startX + x * beadSize, startY + y * beadSize, beadSize, grid[y][x]);
    }
  }

  return { beadSize, startX, startY, gridWidth, gridHeight };
}

export function createCanvasContext(size: number): { canvas: any; ctx: CanvasRenderingContext2D } {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

export function bufferPng(canvas: any): Buffer {
  return canvas.toBuffer('image/png');
}
