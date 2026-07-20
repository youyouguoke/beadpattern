import type { VisualSpec } from './types.js';

export const ANIMAL_SPEC: VisualSpec = {
  category: 'animal',
  composition: 'center',
  symmetry: 'vertical',
  outline: 'strong',
  style: 'cute',
  maxColors: 5,
  background: '#ffffff',
  gridSize: 29,
  margin: 2,
  padding: 48,
  eyeStyle: 'round',
  highlight: false,
};

export const FOOD_SPEC: VisualSpec = {
  category: 'food',
  composition: 'center',
  symmetry: 'none',
  outline: 'medium',
  style: 'flat',
  maxColors: 6,
  background: '#ffffff',
  gridSize: 29,
  margin: 2,
  padding: 48,
  highlight: true,
};

export const HOLIDAY_SPEC: VisualSpec = {
  category: 'holiday',
  composition: 'center',
  symmetry: 'vertical',
  outline: 'strong',
  style: 'cute',
  maxColors: 8,
  background: '#fff5f5',
  gridSize: 57,
  margin: 3,
  padding: 56,
  highlight: true,
};

export const DEFAULT_BEAD_PALETTE = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Gray', hex: '#757575' },
  { name: 'Red', hex: '#e53935' },
  { name: 'Dark Red', hex: '#b71c1c' },
  { name: 'Orange', hex: '#fb8c00' },
  { name: 'Yellow', hex: '#fdd835' },
  { name: 'Lime', hex: '#7cb342' },
  { name: 'Green', hex: '#2e7d32' },
  { name: 'Teal', hex: '#00897b' },
  { name: 'Cyan', hex: '#00acc1' },
  { name: 'Light Blue', hex: '#4fc3f7' },
  { name: 'Blue', hex: '#1e88e5' },
  { name: 'Navy', hex: '#0d47a1' },
  { name: 'Purple', hex: '#8e24aa' },
  { name: 'Pink', hex: '#f06292' },
  { name: 'Hot Pink', hex: '#d81b60' },
  { name: 'Brown', hex: '#6d4c41' },
  { name: 'Tan', hex: '#d7ccc8' },
  { name: 'Light Gray', hex: '#bdbdbd' },
  { name: 'Gold', hex: '#fbc02d' },
  { name: 'Cream', hex: '#fff9c4' },
];

export function getSpecByCategory(category: string): VisualSpec {
  switch (category) {
    case 'animal':
      return ANIMAL_SPEC;
    case 'food':
      return FOOD_SPEC;
    case 'holiday':
      return HOLIDAY_SPEC;
    default:
      return ANIMAL_SPEC;
  }
}
