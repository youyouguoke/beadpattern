import { getDB } from '../src/lib/db';
import { normalizeColorPalette, enrichPaletteFromGrid, computeStats } from '../src/lib/colors';
import type { Pattern } from '../src/types';

async function main() {
  const env = { DB: (globalThis as any).__D1_DB } as any;
  if (!env.DB) {
    throw new Error('No DB binding available. Run via wrangler or set global __D1_DB.');
  }
  const db = getDB(env);
  const rows = await db.query<Pattern>(`SELECT id, grid_data, color_palette FROM patterns WHERE grid_data IS NOT NULL AND grid_data != 'null'`);
  let updated = 0;
  for (const row of rows) {
    let grid: (string | number)[][] | null = null;
    try {
      grid = JSON.parse(row.grid_data as string);
    } catch {
      continue;
    }
    if (!Array.isArray(grid) || grid.length === 0) continue;
    const stats = computeStats(grid);
    const rawPalette = normalizeColorPalette(JSON.parse((row.color_palette as string) || '[]') as string[] | any[]);
    const enriched = enrichPaletteFromGrid(rawPalette, grid);
    await db.update('patterns', {
      estimated_beads: stats.estimated_beads,
      color_count: stats.color_count,
      color_palette: JSON.stringify(enriched),
    }, { id: row.id });
    updated++;
  }
  console.log(`Updated ${updated} patterns`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
