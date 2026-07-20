import { createCanvasContext, drawBeadBoard, bufferPng } from './core.js';

export function renderPrintable(grid: string[][], options: { background?: string; boardColor?: string; margin?: number } = {}): Buffer {
  const canvasSize = 1600;
  const { ctx } = createCanvasContext(canvasSize);
  const boardInfo = drawBeadBoard(ctx, grid, canvasSize, { ...options, background: options.background || '#ffffff', boardColor: options.boardColor || '#f7f7f7', margin: options.margin || 60 });

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

  return bufferPng(ctx.canvas);
}
