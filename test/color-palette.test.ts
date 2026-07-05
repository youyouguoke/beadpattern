import { describe, it, expect } from 'vitest';
import {
  normalizeColorPalette,
  enrichPaletteFromGrid,
  computeStats,
} from '../src/lib/colors';

describe('color palette helpers', () => {
  describe('normalizeColorPalette', () => {
    it('returns empty array for undefined input', () => {
      expect(normalizeColorPalette(undefined)).toEqual([]);
    });

    it('converts string array to PatternColor with fallback names', () => {
      const result = normalizeColorPalette(['#FF0000', '#00FF00']);
      expect(result).toEqual([
        { name: 'Color 1', hex: '#FF0000', count: 0 },
        { name: 'Color 2', hex: '#00FF00', count: 0 },
      ]);
    });

    it('keeps object array fields and defaults missing count', () => {
      const result = normalizeColorPalette([
        { name: 'Red', code: 'R01', hex: '#FF0000' },
        { name: 'Green', code: 'G01', hex: '#00FF00', count: 5 },
      ]);
      expect(result).toEqual([
        { name: 'Red', code: 'R01', hex: '#FF0000', count: 0 },
        { name: 'Green', code: 'G01', hex: '#00FF00', count: 5 },
      ]);
    });
  });

  describe('enrichPaletteFromGrid', () => {
    const palette = normalizeColorPalette([
      { name: 'Red', code: 'R01', hex: '#FF0000' },
      { name: 'Green', code: 'G01', hex: '#00FF00' },
      { name: 'Blue', code: 'B01', hex: '#0000FF' },
    ]);

    it('returns palette unchanged when grid is empty', () => {
      expect(enrichPaletteFromGrid(palette, null)).toEqual(palette);
    });

    it('counts beads per color from a hex grid', () => {
      const grid = [
        ['#FF0000', '#00FF00', '#0000FF'],
        ['#00FF00', '#FF0000', '#00FF00'],
        ['#0000FF', '#00FF00', '#FF0000'],
      ];
      const enriched = enrichPaletteFromGrid(palette, grid);
      expect(enriched.map((c) => c.count)).toEqual([3, 4, 2]);
    });

    it('is case-insensitive when matching hex', () => {
      const grid = [['#ff0000', '#00FF00']];
      const enriched = enrichPaletteFromGrid(palette, grid);
      expect(enriched[0].count).toBe(1);
      expect(enriched[1].count).toBe(1);
    });
  });

  describe('computeStats', () => {
    it('returns zero for empty grid', () => {
      expect(computeStats(null)).toEqual({ color_count: 0, estimated_beads: 0 });
    });

    it('counts unique colors and total cells', () => {
      const grid = [
        ['#FF0000', '#00FF00'],
        ['#00FF00', '#FF0000'],
      ];
      expect(computeStats(grid)).toEqual({ color_count: 2, estimated_beads: 4 });
    });
  });
});
