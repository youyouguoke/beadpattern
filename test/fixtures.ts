export const testPattern = {
  title: 'Test Pixel',
  slug: 'test-pixel',
  description: 'A test pattern for unit tests.',
  difficulty: 'easy',
  cover_image: 'https://example.com/cover.png',
  grid_size: '3x3',
  grid_data: [
    ['#FF0000', '#00FF00', '#0000FF'],
    ['#00FF00', '#FF0000', '#00FF00'],
    ['#0000FF', '#00FF00', '#FF0000'],
  ],
  color_palette: [
    { name: 'Red', code: 'R01', hex: '#FF0000', count: 3 },
    { name: 'Green', code: 'G01', hex: '#00FF00', count: 4 },
    { name: 'Blue', code: 'B01', hex: '#0000FF', count: 2 },
  ],
  tags: ['animals'],
  steps: [
    { description: 'Row 1' },
    { description: 'Row 2' },
  ],
};

export const testPatternLegacyPalette = {
  title: 'Legacy Pixel',
  slug: 'legacy-pixel',
  description: 'Pattern with old string color_palette.',
  difficulty: 'medium',
  grid_size: '2x2',
  grid_data: [
    ['#FF0000', '#00FF00'],
    ['#00FF00', '#FF0000'],
  ],
  color_palette: ['#FF0000', '#00FF00'],
};
