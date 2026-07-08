import fs from 'fs';
import path from 'path';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

const CANVAS_SIZE = 1024;
const MARGIN = 80;
const MAX_BEAD_SIZE = 20;
const MIN_BEAD_SIZE = 6;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.toLowerCase();
  let r = 0, g = 0, b = 0;
  if (h.length === 4) {
    r = parseInt(h[1] + h[1], 16);
    g = parseInt(h[2] + h[2], 16);
    b = parseInt(h[3] + h[3], 16);
  } else if (h.length === 7) {
    r = parseInt(h.slice(1, 3), 16);
    g = parseInt(h.slice(3, 5), 16);
    b = parseInt(h.slice(5, 7), 16);
  }
  return { r, g, b };
}

function parseGrid(gridData: unknown): string[][] | null {
  if (!gridData || !Array.isArray(gridData)) return null;
  const rows: string[][] = [];
  for (const row of gridData) {
    if (!Array.isArray(row)) return null;
    const parsedRow: string[] = [];
    for (const cell of row) {
      if (typeof cell === 'string') parsedRow.push(cell);
      else if (typeof cell === 'number') parsedRow.push(String(cell));
      else parsedRow.push('#000000');
    }
    rows.push(parsedRow);
  }
  return rows;
}

export function renderPatternImage(gridData: unknown, options: { finished?: boolean } = {}) {
  const grid = parseGrid(gridData);
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = options.finished ? '#1a1a2e' : '#f8f9fa';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (!grid || grid.length === 0 || grid[0].length === 0) {
    // fallback: draw placeholder title
    drawPlaceholder(ctx);
    return canvas;
  }

  const rows = grid.length;
  const cols = grid[0].length;
  const maxDim = Math.max(cols, rows);
  const beadSize = Math.max(MIN_BEAD_SIZE, Math.min(MAX_BEAD_SIZE, Math.floor((CANVAS_SIZE - MARGIN * 2) / maxDim)));
  const gridWidth = cols * beadSize;
  const gridHeight = rows * beadSize;
  const startX = (CANVAS_SIZE - gridWidth) / 2;
  const startY = (CANVAS_SIZE - gridHeight) / 2;

  // Draw shadow board
  ctx.fillStyle = options.finished ? '#16213e' : '#e9ecef';
  const boardPadding = 20;
  roundRect(ctx, startX - boardPadding, startY - boardPadding, gridWidth + boardPadding * 2, gridHeight + boardPadding * 2, 16);
  ctx.fill();

  // Draw beads
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid[y][x] || '#000000';
      const px = startX + x * beadSize;
      const py = startY + y * beadSize;
      drawBead(ctx, px, py, beadSize, color);
    }
  }

  // Finished image: add glossy frame effect
  if (options.finished) {
    drawFinishedFrame(ctx, startX, startY, gridWidth, gridHeight);
  }

  return canvas;
}

function drawBead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const radius = size * 0.35;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const { r, g, b } = hexToRgb(color);

  // bead shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(centerX + 1, centerY + 1, radius, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // bead body
  const gradient = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.4, radius * 0.1, centerX, centerY, radius);
  gradient.addColorStop(0, `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`);
  gradient.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
  gradient.addColorStop(1, `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // bead hole
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius * 0.2, radius * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFinishedFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  // inner glow
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.15)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 10, y - 10, width + 20, height + 20);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#adb5bd';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Bead Pattern', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
}

export function canvasToPngBuffer(canvas: ReturnType<typeof createCanvas>): Buffer {
  return canvas.toBuffer('image/png');
}
