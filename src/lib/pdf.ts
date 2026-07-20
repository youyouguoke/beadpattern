import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function parseGrid(grid: unknown): string[][] {
  if (!grid) return [];
  if (Array.isArray(grid)) return grid.map((row) => Array.isArray(row) ? row.map((c) => String(c)) : []) as string[][];
  if (typeof grid === 'string') {
    try {
      const parsed = JSON.parse(grid);
      if (Array.isArray(parsed)) return parsed.map((row) => Array.isArray(row) ? row.map((c) => String(c)) : []) as string[][];
    } catch { /* ignore */ }
  }
  return [];
}

function parsePalette(palette: unknown): { hex: string; name?: string; count?: number }[] {
  if (!palette) return [];
  if (Array.isArray(palette)) {
    return palette.map((c) => {
      if (typeof c === 'string') return { hex: c };
      const hex = (c as Record<string, unknown>).hex || (c as Record<string, unknown>).name || '#000000';
      return { hex: String(hex), name: String((c as Record<string, unknown>).name || ''), count: Number((c as Record<string, unknown>).count || 0) };
    });
  }
  if (typeof palette === 'string') {
    try {
      const parsed = JSON.parse(palette);
      if (Array.isArray(parsed)) return parsePalette(parsed);
    } catch { /* ignore */ }
  }
  return [];
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

export interface PatternForPdf {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  grid_data: unknown;
  color_palette: unknown;
  color_count: number;
  estimated_beads: number;
  grid_size?: string | null;
  scale?: number;
}

export async function generatePatternPdf(pattern: PatternForPdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const scale = Math.max(1, Math.min(5, Math.floor(pattern.scale ?? 1)));
  const basePage = [612, 792] as const;
  const page = doc.addPage([basePage[0] * scale, basePage[1] * scale]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  let y = height - margin;

  // Title
  page.drawText(pattern.title, {
    x: margin,
    y,
    size: 24,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 30;

  // Meta
  page.drawText(`Grid: ${pattern.grid_size || 'N/A'} | Estimated beads: ${pattern.estimated_beads} | Colors: ${pattern.color_count}`, {
    x: margin,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 22;

  if (pattern.description) {
    page.drawText(pattern.description, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
      maxWidth: width - margin * 2,
    });
    y -= 30;
  }

  // Grid
  const grid = parseGrid(pattern.grid_data);
  if (grid.length > 0) {
    const rows = grid.length;
    const cols = grid[0].length;
    const maxGridSize = 360;
    const cellSize = Math.min(maxGridSize / cols, maxGridSize / rows, 14);
    const gridW = cellSize * cols;
    const gridH = cellSize * rows;
    const startX = (width - gridW) / 2;
    const startY = y - gridH - 20;

    // border
    page.drawRectangle({
      x: startX,
      y: startY,
      width: gridW,
      height: gridH,
      color: rgb(0.9, 0.9, 0.9),
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = grid[r][c] || '#ffffff';
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
  }

  // Color palette
  const palette = parsePalette(pattern.color_palette);
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
    for (let i = 0; i < palette.length; i++) {
      const color = palette[i];
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
      page.drawText(`${color.name || color.hex}${color.count ? ` (${color.count})` : ''}`, {
        x: margin + swatchSize + 8,
        y: y - swatchSize + 1,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 18;
      if (y < margin + 40) {
        // add a new page if needed
        const newPage = doc.addPage([612 * scale, 792 * scale]);
        y = newPage.getSize().height - margin;
      }
    }
  }

  return doc.save();
}
