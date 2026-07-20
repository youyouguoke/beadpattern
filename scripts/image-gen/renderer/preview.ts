import { createCanvasContext, drawBeadBoard, bufferPng } from './core.js';

export function renderPreview(grid: string[][], options: { background?: string; margin?: number } = {}): Buffer {
  const canvasSize = 1024;
  const { ctx } = createCanvasContext(canvasSize);
  const boardInfo = drawBeadBoard(ctx, grid, canvasSize, {
    ...options,
    background: options.background || '#1a1d2b',
    boardColor: '#23263a',
    margin: options.margin || 60,
  });

  const gradient = ctx.createLinearGradient(boardInfo.startX, boardInfo.startY, boardInfo.startX + boardInfo.gridWidth, boardInfo.startY + boardInfo.gridHeight);
  gradient.addColorStop(0, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 5;
  ctx.strokeRect(boardInfo.startX - 12, boardInfo.startY - 12, boardInfo.gridWidth + 24, boardInfo.gridHeight + 24);

  return bufferPng(ctx.canvas);
}
