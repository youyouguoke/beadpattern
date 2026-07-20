import type { Palette, Swatch } from './types.js';

// Brand color ratios: main 70%, secondary 20%, accent 10%
// Each animal gets a signature palette designed for premium Perler art.

const makeSwatch = (index: number, hex: string, name: string, type: Swatch['type']): Swatch => ({
  index,
  hex,
  name,
  type,
});

const catPalette: Palette = {
  name: 'Premium Gray Cat',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'Outline', 'outline'),
    makeSwatch(2, '#7a8b99', 'Main Gray', 'base'),
    makeSwatch(3, '#a8b8c8', 'Light Gray', 'highlight'),
    makeSwatch(4, '#4a5568', 'Shadow Gray', 'shadow'),
    makeSwatch(5, '#f4d0b5', 'Pink Nose', 'accent'),
    makeSwatch(6, '#ffb3ba', 'Blush', 'blush'),
    makeSwatch(7, '#2a3b4c', 'Eye Blue', 'eye'),
  ],
  outline: 1,
  base: 2,
  shadow: 4,
  highlight: 3,
  accent: 5,
  blush: 6,
  eye: 7,
};

const orangeCatPalette: Palette = {
  name: 'Premium Orange Cat',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'Outline', 'outline'),
    makeSwatch(2, '#d97a2e', 'Burnt Orange', 'base'),
    makeSwatch(3, '#f2c98a', 'Cream', 'highlight'),
    makeSwatch(4, '#a0522d', 'Rust Shadow', 'shadow'),
    makeSwatch(5, '#f4d0b5', 'Pink Nose', 'accent'),
    makeSwatch(6, '#ffb3ba', 'Blush', 'blush'),
    makeSwatch(7, '#2a8f4c', 'Eye Green', 'eye'),
  ],
  outline: 1,
  base: 2,
  shadow: 4,
  highlight: 3,
  accent: 5,
  blush: 6,
  eye: 7,
};

const bunnyPalette: Palette = {
  name: 'Premium Bunny',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'Outline', 'outline'),
    makeSwatch(2, '#f5e6d3', 'Cream White', 'base'),
    makeSwatch(3, '#ffffff', 'Pure White', 'highlight'),
    makeSwatch(4, '#d4bfa5', 'Warm Shadow', 'shadow'),
    makeSwatch(5, '#ffb7c5', 'Pink Nose/Ear', 'accent'),
    makeSwatch(6, '#ff9eb5', 'Blush', 'blush'),
    makeSwatch(7, '#5c3a21', 'Eye Brown', 'eye'),
  ],
  outline: 1,
  base: 2,
  shadow: 4,
  highlight: 3,
  accent: 5,
  blush: 6,
  eye: 7,
};

const foxPalette: Palette = {
  name: 'Premium Fox',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'Outline', 'outline'),
    makeSwatch(2, '#c45c26', 'Burnt Orange', 'base'),
    makeSwatch(3, '#f5e0c5', 'Cream', 'highlight'),
    makeSwatch(4, '#7a3c18', 'Dark Brown', 'shadow'),
    makeSwatch(5, '#2a2a2a', 'Nose/Ear Tip', 'accent'),
    makeSwatch(6, '#ffb3ba', 'Blush', 'blush'),
    makeSwatch(7, '#3a5a3a', 'Eye Green', 'eye'),
  ],
  outline: 1,
  base: 2,
  shadow: 4,
  highlight: 3,
  accent: 5,
  blush: 6,
  eye: 7,
};

const pandaPalette: Palette = {
  name: 'Premium Panda',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'Black', 'outline'),
    makeSwatch(2, '#1a1a1a', 'Black Fur', 'base'),
    makeSwatch(3, '#f5f5f5', 'White', 'highlight'),
    makeSwatch(4, '#b0b0b0', 'Gray Shadow', 'shadow'),
    makeSwatch(5, '#ffb3ba', 'Pink Nose', 'accent'),
    makeSwatch(6, '#ff9eb5', 'Blush', 'blush'),
    makeSwatch(7, '#2a2a2a', 'Eye', 'eye'),
  ],
  outline: 1,
  base: 2,
  shadow: 4,
  highlight: 3,
  accent: 5,
  blush: 6,
  eye: 7,
};

const bearPalette: Palette = {
  name: 'Premium Bear',
  swatches: [
    makeSwatch(1, '#1a1a1a', 'Outline', 'outline'),
    makeSwatch(2, '#8a9a7b', 'Sage Green', 'base'),
    makeSwatch(3, '#d4d9c8', 'Cream', 'highlight'),
    makeSwatch(4, '#556b4a', 'Forest Shadow', 'shadow'),
    makeSwatch(5, '#4a3b2a', 'Dark Brown', 'accent'),
    makeSwatch(6, '#ffb3ba', 'Blush', 'blush'),
    makeSwatch(7, '#2a2a2a', 'Eye', 'eye'),
  ],
  outline: 1,
  base: 2,
  shadow: 4,
  highlight: 3,
  accent: 5,
  blush: 6,
  eye: 7,
};

const palettes: Record<string, Palette> = {
  'gray-cat': catPalette,
  'orange-cat': orangeCatPalette,
  'bunny': bunnyPalette,
  'fox': foxPalette,
  'panda': pandaPalette,
  'bear': bearPalette,
};

export function getPalette(name: string): Palette {
  const palette = palettes[name];
  if (!palette) throw new Error(`Palette not found: ${name}`);
  return palette;
}

export function listPalettes(): string[] {
  return Object.keys(palettes);
}

export function getPaletteByAnimal(animal: string): string {
  const map: Record<string, string> = {
    cat: 'gray-cat',
    bunny: 'bunny',
    fox: 'fox',
    panda: 'panda',
    bear: 'bear',
  };
  return map[animal] ?? 'gray-cat';
}
