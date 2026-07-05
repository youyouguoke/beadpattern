import type { PatternColor } from '../types';

export function normalizeColorPalette(
  palette: string[] | PatternColor[] | undefined
): PatternColor[] {
  if (!palette || palette.length === 0) return [];
  return palette.map((c, i) => {
    if (typeof c === 'string') {
      return {
        name: `Color ${i + 1}`,
        hex: c,
        count: 0,
      };
    }
    return {
      name: c.name || `Color ${i + 1}`,
      code: c.code,
      hex: c.hex,
      count: c.count ?? 0,
    };
  });
}

export function enrichPaletteFromGrid(
  palette: PatternColor[],
  grid: (string | number)[][] | null
): PatternColor[] {
  if (!grid || grid.length === 0) return palette;

  const counts = new Map<string, number>();
  for (const row of grid) {
    for (const cell of row) {
      const key = typeof cell === 'string' ? cell.toLowerCase() : String(cell);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return palette.map((c) => {
    const hex = c.hex.toLowerCase();
    const count = counts.get(hex) ?? c.count ?? 0;
    return { ...c, count };
  });
}

export function computeStats(grid: (string | number)[][] | null) {
  if (!grid || grid.length === 0) return { color_count: 0, estimated_beads: 0 };
  const seen = new Set<string>();
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      seen.add(typeof cell === 'string' ? cell.toLowerCase() : String(cell));
      total++;
    }
  }
  return { color_count: seen.size, estimated_beads: total };
}
