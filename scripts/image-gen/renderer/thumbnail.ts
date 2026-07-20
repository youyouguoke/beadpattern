import { createCanvasContext, drawBeadBoard, bufferPng } from './core.js';

export function renderThumbnail(grid: string[][], options: { background?: string; margin?: number } = {}): Buffer {
  const canvasSize = 400;
  const { ctx } = createCanvasContext(canvasSize);
  drawBeadBoard(ctx, grid, canvasSize, { ...options, background: options.background || '#ffffff', margin: options.margin || 24 });
  return bufferPng(ctx.canvas);
}
