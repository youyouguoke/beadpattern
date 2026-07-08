import { Hono } from 'hono';
import { getDB } from '../../lib/db';
import { normalizeColorPalette, enrichPaletteFromGrid, computeStats } from '../../lib/colors';
import { success } from '../../lib/response';
import type { Bindings } from '../../lib/env';
import type { Pattern } from '../../types';

const recomputeStats = new Hono<{ Bindings: Bindings }>();

recomputeStats.post('/', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<Pattern>(
    `SELECT id, grid_data, color_palette FROM patterns WHERE grid_data IS NOT NULL AND grid_data != 'null'`
  );

  let updated = 0;
  let skipped = 0;
  const errors: Array<{ id: string; reason: string }> = [];

  for (const row of rows) {
    let grid: (string | number)[][] | null = null;
    try {
      grid = JSON.parse(row.grid_data as string);
    } catch {
      skipped++;
      continue;
    }

    if (!Array.isArray(grid) || grid.length === 0) {
      skipped++;
      continue;
    }

    try {
      const stats = computeStats(grid);
      let rawPalette: ReturnType<typeof normalizeColorPalette> = [];
      try {
        rawPalette = normalizeColorPalette(
          JSON.parse((row.color_palette as string) || '[]') as string[] | any[]
        );
      } catch {
        rawPalette = [];
      }
      const enriched = enrichPaletteFromGrid(rawPalette, grid);
      await db.update(
        'patterns',
        {
          estimated_beads: stats.estimated_beads,
          color_count: stats.color_count,
          color_palette: JSON.stringify(enriched),
        },
        { id: row.id }
      );
      updated++;
    } catch (e) {
      errors.push({ id: row.id as string, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return c.json(success({ total: rows.length, updated, skipped, errors }));
});

export default recomputeStats;
