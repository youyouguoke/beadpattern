import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
interface PatternColor {
  name: string;
  hex: string;
}
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '').trim();
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = parseInt(full, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((num >> 16) & 0xff) / 255,
    g: ((num >> 8) & 0xff) / 255,
    b: (num & 0xff) / 255,
  };
}

export interface PatternPdfInput {
  title: string;
  grid: string[][];
  palette: PatternColor[];
  gridSize?: string;
  beadCount?: number;
  difficulty?: string;
}

export async function generatePatternPdf(input: PatternPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  let y = height - margin;

  const rows = input.grid.length;
  const cols = input.grid[0]?.length || 0;
  const beadCount = input.beadCount || input.grid.flat().filter((c) => c !== '#ffffff').length;
  const colorCounts = countColors(input.grid);

  // Title
  page.drawText(input.title, {
    x: margin,
    y,
    size: 24,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 30;

  // Meta
  const meta = `Grid: ${input.gridSize || `${cols}×${rows}`} | Beads: ${beadCount} | Colors: ${Object.keys(colorCounts).length}${input.difficulty ? ` | Difficulty: ${input.difficulty}` : ''}`;
  page.drawText(meta, {
    x: margin,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;

  // Grid
  const maxGridSize = 360;
  const cellSize = Math.min(maxGridSize / cols, maxGridSize / rows, 14);
  const gridW = cellSize * cols;
  const gridH = cellSize * rows;
  const startX = (width - gridW) / 2;
  const startY = y - gridH - 20;

  page.drawRectangle({
    x: startX,
    y: startY,
    width: gridW,
    height: gridH,
    color: rgb(0.96, 0.96, 0.96),
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = input.grid[r][c] || '#ffffff';
      const { r: pr, g: pg, b: pb } = hexToRgb(color);
      page.drawRectangle({
        x: startX + c * cellSize,
        y: startY + (rows - 1 - r) * cellSize,
        width: cellSize - 0.2,
        height: cellSize - 0.2,
        color: rgb(pr, pg, pb),
      });
    }
  }
  y = startY - 10;

  // Color palette
  const palette = input.palette.filter((p) => colorCounts[p.hex]);
  if (palette.length > 0) {
    page.drawText('Color Palette', {
      x: margin,
      y,
      size: 14,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 18;

    const swatchSize = 12;
    for (const color of palette) {
      const count = colorCounts[color.hex] || 0;
      const { r, g, b } = hexToRgb(color.hex);
      page.drawRectangle({
        x: margin,
        y: y - swatchSize,
        width: swatchSize,
        height: swatchSize,
        color: rgb(r, g, b),
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 0.5,
      });
      page.drawText(`${color.name || color.hex} — ${count} beads`, {
        x: margin + swatchSize + 8,
        y: y - swatchSize + 1,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 18;
      if (y < margin + 40) {
        const newPage = doc.addPage([612, 792]);
        y = newPage.getSize().height - margin;
      }
    }
  }

  return doc.save();
}

function countColors(grid: string[][]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of grid) {
    for (const color of row) {
      if (!result[color]) result[color] = 0;
      result[color]++;
    }
  }
  return result;
}
