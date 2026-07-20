import type { AnimalType, Palette, ColorSwatch } from './types.js';

const baseSwatch = (id: string, hex: string, name: string): ColorSwatch => ({ id, name, hex, usage: 'base' });
const shadowSwatch = (id: string, hex: string, name: string): ColorSwatch => ({ id, name, hex, usage: 'shadow' });
const highlightSwatch = (id: string, hex: string, name: string): ColorSwatch => ({ id, name, hex, usage: 'highlight' });
const outlineSwatch = (id: string, hex: string, name: string): ColorSwatch => ({ id, name, hex, usage: 'outline' });
const accentSwatch = (id: string, hex: string, name: string): ColorSwatch => ({ id, name, hex, usage: 'accent' });

export const palettes: Record<string, Palette> = {
  'gray-cat': {
    name: 'Gray Cat',
    swatches: [
      outlineSwatch('black', '#1a1a1a', 'Black'),
      baseSwatch('gray', '#9ca3af', 'Gray'),
      shadowSwatch('dark-gray', '#4b5563', 'Dark Gray'),
      highlightSwatch('white', '#f3f4f6', 'White'),
      accentSwatch('pink', '#f9a8d4', 'Pink'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'orange-cat': {
    name: 'Orange Cat',
    swatches: [
      outlineSwatch('black', '#1a1a1a', 'Black'),
      baseSwatch('orange', '#fb923c', 'Orange'),
      shadowSwatch('dark-orange', '#c2410c', 'Dark Orange'),
      highlightSwatch('cream', '#fef3c7', 'Cream'),
      accentSwatch('pink', '#f9a8d4', 'Pink'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'corgi': {
    name: 'Corgi',
    swatches: [
      outlineSwatch('black', '#1a1a1a', 'Black'),
      baseSwatch('tan', '#d97706', 'Tan'),
      shadowSwatch('brown', '#92400e', 'Brown'),
      highlightSwatch('cream', '#fff7ed', 'Cream'),
      accentSwatch('pink', '#fda4af', 'Pink'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'shiba': {
    name: 'Shiba Inu',
    swatches: [
      outlineSwatch('black', '#1a1a1a', 'Black'),
      baseSwatch('orange', '#ea580c', 'Orange'),
      shadowSwatch('brown', '#7c2d12', 'Brown'),
      highlightSwatch('cream', '#fef3c7', 'Cream'),
      accentSwatch('pink', '#fda4af', 'Pink'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'panda': {
    name: 'Panda',
    swatches: [
      outlineSwatch('black', '#0a0a0a', 'Black'),
      baseSwatch('white', '#f9fafb', 'White'),
      shadowSwatch('gray', '#9ca3af', 'Gray'),
      highlightSwatch('white-bright', '#ffffff', 'Bright White'),
      accentSwatch('bamboo', '#65a30d', 'Bamboo'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'fox': {
    name: 'Fox',
    swatches: [
      outlineSwatch('black', '#1a1a1a', 'Black'),
      baseSwatch('orange', '#f97316', 'Orange'),
      shadowSwatch('dark-orange', '#9a3412', 'Dark Orange'),
      highlightSwatch('cream', '#ffedd5', 'Cream'),
      accentSwatch('white', '#ffffff', 'White'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'penguin': {
    name: 'Penguin',
    swatches: [
      outlineSwatch('black', '#111827', 'Black'),
      baseSwatch('dark-blue', '#1f2937', 'Dark Blue'),
      shadowSwatch('black-gray', '#374151', 'Black Gray'),
      highlightSwatch('white', '#f9fafb', 'White'),
      accentSwatch('orange', '#f97316', 'Orange'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'lion': {
    name: 'Lion',
    swatches: [
      outlineSwatch('black', '#1a1a1a', 'Black'),
      baseSwatch('gold', '#facc15', 'Gold'),
      shadowSwatch('brown', '#a16207', 'Brown'),
      highlightSwatch('cream', '#fef9c3', 'Cream'),
      accentSwatch('orange', '#f97316', 'Orange'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
  'bunny': {
    name: 'Bunny',
    swatches: [
      outlineSwatch('black', '#1a1a1a', 'Black'),
      baseSwatch('white', '#f3f4f6', 'White'),
      shadowSwatch('gray', '#d1d5db', 'Gray'),
      highlightSwatch('white-bright', '#ffffff', 'Bright White'),
      accentSwatch('pink', '#f9a8d4', 'Pink'),
    ],
    outline: 1, base: 2, shadow: 3, highlight: 4, accent: 5,
  },
};

export function getPalette(name: string): Palette {
  if (!palettes[name]) {
    throw new Error(`Unknown palette: ${name}`);
  }
  return palettes[name];
}

export function paletteNames(): string[] {
  return Object.keys(palettes);
}
