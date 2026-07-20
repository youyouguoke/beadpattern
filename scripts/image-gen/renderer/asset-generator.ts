import type { GridOutput, AssetOutput, PatternMetadata, PatternDSL, QualityScore } from '../pipeline/types.js';
import { renderCover } from './cover.js';
import { renderPreview } from './preview.js';
import { renderThumbnail } from './thumbnail.js';
import { renderPrintable } from './printable.js';
import { generatePatternPdf } from './pdf-generator.js';

export interface AssetGeneratorInput {
  gridOutput: GridOutput;
  title: string;
  dsl?: PatternDSL;
}

export class AssetGenerator {
  async generate(input: AssetGeneratorInput): Promise<AssetOutput> {
    const { gridOutput, title, dsl } = input;
    const grid = gridOutput.grid;
    const palette = gridOutput.palette;

    const usedColors = Array.from(new Set(grid.flat()));
    const beadCount = grid.flat().filter((c) => c !== gridOutput.palette[gridOutput.palette.length - 1]?.hex).length;
    const colorCount = usedColors.length;
    const gridSize = `${grid[0].length}x${grid.length}`;

    const counts: Record<string, number> = {};
    for (const c of grid.flat()) counts[c] = (counts[c] || 0) + 1;
    const colors = usedColors.map((hex) => ({ hex, name: palette.find((p) => p.hex === hex)?.name || hex, count: counts[hex] || 0 }));

    const qualityScore = gridOutput.quality || {
      shape: 0, craftability: 0, color: 0, symmetry: 0, detail: 0, total: gridOutput.score, reasons: gridOutput.reasons,
    };

    const cover = renderCover(grid, palette, title, { gridSize, beadCount, colorCount });
    const preview = renderPreview(grid);
    const thumbnail = renderThumbnail(grid);
    const printable = renderPrintable(grid);
    const pdf = await generatePatternPdf({ title, grid, palette, gridSize, beadCount, difficulty: 'easy' });

    const metadata: PatternMetadata = {
      gridSize,
      beadCount,
      colorCount,
      colors,
      qualityScore,
      generatedAt: new Date().toISOString(),
      dsl,
    };

    return { cover, preview, thumbnail, printable, pdf, metadata };
  }
}

export { renderCover, renderPreview, renderThumbnail, renderPrintable };
