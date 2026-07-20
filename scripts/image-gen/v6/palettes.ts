import type { Palette, Swatch } from './types.js';

const makeSwatch = (index: number, hex: string, name: string, type: Swatch['type']): Swatch => ({
  index, hex, name, type,
});

const catPalette: Palette = {
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

const foxPalette: Palette = {
  name: 'Red Fox',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'outline', 'outline'),
    makeSwatch(2, '#c45c26', 'fox orange', 'base'),
    makeSwatch(3, '#8a3a12', 'dark orange', 'shadow'),
    makeSwatch(4, '#f5e0c5', 'cream', 'highlight'),
    makeSwatch(5, '#f5e0c5', 'chest', 'belly'),
    makeSwatch(6, '#f5e0c5', 'ear inner', 'ear'),
    makeSwatch(7, '#2a2a2a', 'nose', 'nose'),
    makeSwatch(8, '#3a5a3a', 'eye', 'eye'),
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

const palettes: Record<string, Palette> = {
  'tabby-cat': catPalette,
  'red-fox': foxPalette,
};

export function getPalette(name: string): Palette {
  const palette = palettes[name];
  if (!palette) throw new Error(`Palette not found: ${name}`);
  return palette;
}

export function defaultPalette(animal: string): string {
  const map: Record<string, string> = { cat: 'tabby-cat', fox: 'red-fox' };
  return map[animal] ?? 'tabby-cat';
}
