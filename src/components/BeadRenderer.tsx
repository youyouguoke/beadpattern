"use client";

import { useMemo } from "react";

export type BeadGrid = (number | string)[][]; // rows of palette indices, -1 = transparent

export interface BeadRendererProps {
  grid?: BeadGrid;
  palette?: string[];
  width?: number;
  height?: number;
  className?: string;
  beadRadius?: number;
  gap?: number;
  showGrid?: boolean;
  title?: string;
  ariaLabel?: string;
}

function parseGrid(
  grid?: BeadGrid | string | null,
  paletteLength = 1,
  palette?: string[] | null
): { rows: number; cols: number; cells: number[] } {
  if (!grid) return { rows: 0, cols: 0, cells: [] };
  let parsed: BeadGrid;
  try {
    parsed = typeof grid === "string" ? (JSON.parse(grid) as BeadGrid) : grid;
  } catch {
    return { rows: 0, cols: 0, cells: [] };
  }
  if (!Array.isArray(parsed) || !parsed.length) return { rows: 0, cols: 0, cells: [] };
  const rows = parsed.length;
  const cols = Math.max(...parsed.map((r) => (Array.isArray(r) ? r.length : 0)));
  const cells: number[] = [];
  const paletteSet = palette?.length
    ? new Map(palette.map((c, i) => [c.toLowerCase(), i]))
    : null;
  for (let y = 0; y < rows; y++) {
    const row = Array.isArray(parsed[y]) ? parsed[y] : [];
    for (let x = 0; x < cols; x++) {
      const raw = row[x];
      if (paletteSet && typeof raw === "string") {
        const idx = paletteSet.get(raw.toLowerCase());
        cells.push(idx != null && idx >= 0 && idx < paletteLength ? idx : -1);
      } else {
        const idx = typeof raw === "number" ? raw : parseInt(raw, 10);
        cells.push(idx >= 0 && idx < paletteLength ? idx : -1);
      }
    }
  }
  return { rows, cols, cells };
}

export function renderBeadGrid(
  grid?: BeadGrid | string | null,
  palette?: string[] | null,
  opts?: { width?: number; height?: number; showGrid?: boolean; gap?: number; beadRadius?: number }
): { svg: string; width: number; height: number; rows: number; cols: number } {
  const colors = palette?.length ? palette : ["#e5e7eb"];
  const { rows, cols, cells } = parseGrid(grid, colors.length, colors);
  const gap = opts?.gap ?? 0;
  const beadRadius = opts?.beadRadius ?? 0;
  const cellSize = 16;
  const svgWidth = cols * cellSize + (cols + 1) * gap;
  const svgHeight = rows * cellSize + (rows + 1) * gap;
  const width = opts?.width ?? svgWidth;
  const height = opts?.height ?? svgHeight;
  const scaleX = width / svgWidth;
  const scaleY = height / svgHeight;
  const showGrid = opts?.showGrid ?? false;

  let rects = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = cells[y * cols + x];
      if (idx < 0) continue;
      const cx = gap + x * (cellSize + gap) + cellSize / 2;
      const cy = gap + y * (cellSize + gap) + cellSize / 2;
      rects += `<rect x="${cx - cellSize / 2 + beadRadius}" y="${cy - cellSize / 2 + beadRadius}" width="${cellSize - beadRadius * 2}" height="${cellSize - beadRadius * 2}" rx="${beadRadius}" fill="${colors[idx]}" />`;
    }
  }

  let gridLines = "";
  if (showGrid && rows && cols) {
    for (let x = 0; x <= cols; x++) {
      const px = gap + x * (cellSize + gap) - gap / 2;
      gridLines += `<line x1="${px}" y1="0" x2="${px}" y2="${svgHeight}" stroke="#e5e7eb" stroke-width="1" />`;
    }
    for (let y = 0; y <= rows; y++) {
      const py = gap + y * (cellSize + gap) - gap / 2;
      gridLines += `<line x1="0" y1="${py}" x2="${svgWidth}" y2="${py}" stroke="#e5e7eb" stroke-width="1" />`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${width}" height="${height}" role="img" aria-label="Bead pattern grid"><g transform="scale(${scaleX} ${scaleY})">${gridLines}${rects}</g></svg>`;
  return { svg, width, height, rows, cols };
}

export default function BeadRenderer({
  grid,
  palette,
  width = 256,
  height = 256,
  className = "",
  beadRadius = 2,
  gap = 1,
  showGrid = true,
  title,
  ariaLabel,
}: BeadRendererProps) {
  const svg = useMemo(() => {
    return renderBeadGrid(grid, palette, {
      width,
      height,
      showGrid,
      gap,
      beadRadius,
    }).svg;
  }, [grid, palette, width, height, showGrid, gap, beadRadius]);

  return (
    <div
      className={className}
      title={title}
      role="img"
      aria-label={ariaLabel || title || "Bead pattern grid"}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function generateBeadGridFromPalette(
  palette: string[],
  width: number,
  height: number,
  seed: string
): BeadGrid {
  const grid: BeadGrid = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const rand = () => {
    hash = (hash * 1664525 + 1013904223) | 0;
    return (hash >>> 0) / 4294967296;
  };

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const radius = Math.min(width, height) / 2.5;

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) {
        row.push(-1);
      } else {
        const noise = rand();
        const idx = Math.floor(noise * palette.length);
        row.push(idx % palette.length);
      }
    }
    grid.push(row);
  }
  return grid;
}

export function getPatternImage(
pattern: {
  cover_image?: string | null;
  img?: string;
  finished?: string;
  title?: string;
  palette?: { hex: string }[] | string[];
  grid?: string;
  gridData?: BeadGrid | string | null;
},
opts?: { width?: number; height?: number; preferFinished?: boolean; preferGrid?: boolean }
): { type: "image" | "svg"; src: string; svg?: string } {


  const isRealImage = (src?: string | null) =>
    src && !src.includes("placehold.co") && !src.startsWith("data:image/svg+xml");
  // When preferGrid is true, render the actual bead grid as the source of truth
  // even if a placeholder cover image exists. This shows real pattern data.
  if (!opts?.preferGrid) {
    const finishedSrc = pattern.cover_image || pattern.finished || pattern.img;
    if (opts?.preferFinished && isRealImage(finishedSrc)) {
      return { type: "image", src: finishedSrc! };
    }
    if (isRealImage(pattern.cover_image)) {
      return { type: "image", src: pattern.cover_image! };
    }
    if (isRealImage(pattern.img)) {
      return { type: "image", src: pattern.img! };
    }
    if (isRealImage(pattern.finished)) {
      return { type: "image", src: pattern.finished! };
    }
  }

  const palette: string[] = [];
  if (pattern.palette?.length) {
    for (const c of pattern.palette) {
      const hex = typeof c === "string" ? c : (c as { hex: string }).hex;
      if (hex) palette.push(hex);
    }
  }

  // Prefer rendering the actual backend grid data (hex strings or indices) if available.
  const rawGrid = pattern.gridData;
  let parsedGrid: BeadGrid | undefined;
  if (rawGrid != null) {
    if (typeof rawGrid === "string") {
      try {
        parsedGrid = JSON.parse(rawGrid) as BeadGrid;
      } catch {
        parsedGrid = undefined;
      }
    } else {
      parsedGrid = rawGrid as BeadGrid;
    }
  }
  if (Array.isArray(parsedGrid) && parsedGrid.length > 0) {
    const fallbackPalette = palette.length ? palette : ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#48DBFB", "#FFFFFF", "#161D1F"];
    const { svg } = renderBeadGrid(parsedGrid, fallbackPalette, {
      width: opts?.width,
      height: opts?.height,
      showGrid: true,
      gap: 1,
      beadRadius: 2,
    });
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return { type: "svg", src: dataUrl, svg };
  }

  const fallbackPalette = palette.length ? palette : ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#48DBFB", "#FFFFFF", "#161D1F"];
  const gridSize = pattern.grid || "24x24";
  const match = gridSize.match(/(\d+)x(\d+)/i);
  const cols = match ? parseInt(match[1], 10) : 24;
  const rows = match ? parseInt(match[2], 10) : 24;
  const grid = generateBeadGridFromPalette(fallbackPalette, cols, rows, pattern.title || "pattern");
  const { svg } = renderBeadGrid(grid, fallbackPalette, {
    width: opts?.width,
    height: opts?.height,
    showGrid: true,
    gap: 1,
    beadRadius: 2,
  });
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return { type: "svg", src: dataUrl, svg };
}
