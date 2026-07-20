import type { Palette, Swatch } from './types.js';

const makeSwatch = (index: number, hex: string, name: string, type: Swatch['type']): Swatch => ({ index, hex, name, type });

export const catPalette: Palette = {
  name: 'Classic Tabby Cat',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'outline', 'outline'),
    makeSwatch(2, '#8a93a0', 'fur', 'base'),
    makeSwatch(3, '#5a6470', 'fur shadow', 'shadow'),
    makeSwatch(4, '#b4bec9', 'light fur', 'highlight'),
    makeSwatch(5, '#d3bfa3', 'belly', 'belly'),
    makeSwatch(6, '#e8d5c4', 'inner ear', 'ear'),
    makeSwatch(7, '#ff9eb5', 'nose', 'nose'),
    makeSwatch(8, '#2e7d4a', 'eye', 'eye'),
  ],
  outline: 1,
  base: 2,
  shadow: 3,
  highlight: 4,
  belly: 5,
  ear: 6,
  nose: 7,
  eye: 8,
};

export function getPalette(): Palette {
  return catPalette;
}
