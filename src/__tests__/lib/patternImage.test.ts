import { describe, it, expect } from '@jest/globals';
import { renderBeadGrid, getPatternImage, generateBeadGridFromPalette } from '@/lib/patternImage';
import type { BeadGrid } from '@/lib/patternImage';

describe('patternImage', () => {
  it('renderBeadGrid returns SVG string', () => {
    const grid: BeadGrid = [['#000000', '#ffffff']];
    const { svg } = renderBeadGrid(grid, ['#000000', '#ffffff'], {
      width: 100,
      height: 100,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('#000000');
  });

  it('generateBeadGridFromPalette creates a grid within bounds', () => {
    const palette = ['#000000', '#ffffff'];
    const grid = generateBeadGridFromPalette(palette, 5, 5, 'test');
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    for (const row of grid) {
      for (const cell of row) {
        const n = Number(cell);
        expect(n === -1 || (n >= 0 && n < palette.length)).toBe(true);
      }
    }
  });

  it('getPatternImage prefers grid when available', () => {
    const pattern = {
      gridData: [['#000000', '#ffffff'], ['#ffffff', '#000000']],
      colorPalette: [{ hex: '#000000' }, { hex: '#ffffff' }],
      gridSize: '2x2',
    };
    const img = getPatternImage(pattern, { width: 100, height: 100, preferGrid: true });
    expect(img.type).toBe('svg');
    expect(img.src).toContain('data:image/svg+xml');
  });

  it('getPatternImage falls back to cover image', () => {
    const pattern = {
      coverImage: 'https://example.com/cover.png',
      gridSize: '2x2',
    };
    const img = getPatternImage(pattern, { width: 100, height: 100, preferGrid: false });
    expect(img.type).toBe('image');
    expect(img.src).toBe('https://example.com/cover.png');
  });

  it('getPatternImage renders cover image when no grid data', () => {
    const pattern = {
      coverImage: 'https://example.com/cover.png',
      gridSize: '2x2',
    };
    const img = getPatternImage(pattern, { width: 100, height: 100 });
    expect(img.type).toBe('image');
    expect(img.src).toBe('https://example.com/cover.png');
  });

  it('getPatternImage falls back to generated grid when no grid data or image', () => {
    const pattern = {
      colorPalette: [{ hex: '#000000' }, { hex: '#ffffff' }],
      gridSize: '2x2',
      title: 'Test',
    };
    const img = getPatternImage(pattern, { width: 100, height: 100, preferGrid: true });
    expect(img.type).toBe('svg');
    expect(img.src).toContain('data:image/svg+xml');
  });
});
