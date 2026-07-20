import { createCanvasContext, drawBeadBoard, bufferPng } from './core.js';

export function renderCover(
  grid: string[][],
  palette: { name: string; hex: string }[],
  title: string,
  meta: { gridSize: string; beadCount: number; colorCount: number },
  options: { background?: string; margin?: number } = {}
): Buffer {
  const canvasSize = 1024;
  const { ctx } = createCanvasContext(canvasSize);
  const boardInfo = drawBeadBoard(ctx, grid, canvasSize, { ...options, background: options.background || '#ffffff', margin: options.margin || 120 });

  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, canvasSize / 2, 36);

  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText(`${meta.gridSize} Fuse Bead Pattern | ${meta.beadCount} beads | ${meta.colorCount} colors`, canvasSize / 2, 82);

  const legendY = boardInfo.startY + boardInfo.gridHeight + 40;
  const swatchSize = 24;
  const maxPerRow = Math.floor((canvasSize - 80) / 160);
  const usedColors = Array.from(new Set(grid.flat()));
  const items = usedColors.map((hex) => ({ hex, name: palette.find((p) => p.hex === hex)?.name || hex.toUpperCase() }));

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#444';
  ctx.textAlign = 'left';
  ctx.fillText(`Color Palette (${items.length})`, 40, legendY - 6);

  for (let i = 0; i < items.length; i++) {
    const row = Math.floor(i / maxPerRow);
    const col = i % maxPerRow;
    const x = 40 + col * 160;
    const y = legendY + 18 + row * 38;
    // Draw simple color swatch
    ctx.fillStyle = items[i].hex;
    ctx.fillRect(x, y, swatchSize, swatchSize);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, swatchSize, swatchSize);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i].name, x + swatchSize + 8, y + swatchSize / 2);
  }

  return bufferPng(ctx.canvas);
}
