/**
 * Clean taxonomy for BeadPatternAI content seeding (Phase 1).
 * 8 categories, 20 collections, and a curated tag vocabulary.
 */

export const CATEGORIES = [
  { id: 'cat_animals', slug: 'animals', name: 'Animals', subject: 'animals' },
  { id: 'cat_characters', slug: 'characters', name: 'Characters', subject: 'characters' },
  { id: 'cat_food', slug: 'food-drink', name: 'Food & Drink', subject: 'food' },
  { id: 'cat_nature', slug: 'nature', name: 'Nature', subject: 'nature' },
  { id: 'cat_gaming', slug: 'gaming', name: 'Gaming', subject: 'gaming' },
  { id: 'cat_seasonal', slug: 'seasonal-holidays', name: 'Seasonal & Holidays', subject: 'seasonal' },
  { id: 'cat_fantasy', slug: 'fantasy-mythical', name: 'Fantasy & Mythical', subject: 'fantasy' },
  { id: 'cat_objects', slug: 'objects-symbols', name: 'Objects & Symbols', subject: 'objects' },
] as const;

export const COLLECTIONS = [
  { id: 'col_cute_animals', slug: 'cute-animals', categories: ['animals'], style: 'cute', difficulty: 'easy' },
  { id: 'col_pocket_pets', slug: 'pocket-pets', categories: ['animals'], style: 'kawaii', difficulty: 'easy' },
  { id: 'col_farm_friends', slug: 'farm-friends', categories: ['animals'], style: 'cute', difficulty: 'easy' },
  { id: 'col_ocean_life', slug: 'ocean-life', categories: ['animals'], style: 'pixel-art', difficulty: 'easy' },
  { id: 'col_safari', slug: 'safari', categories: ['animals'], style: 'pixel-art', difficulty: 'medium' },
  { id: 'col_baby_animals', slug: 'baby-animals', categories: ['animals'], style: 'kawaii', difficulty: 'easy' },
  { id: 'col_foodie_kawaii', slug: 'foodie-kawaii', categories: ['food-drink'], style: 'kawaii', difficulty: 'easy' },
  { id: 'col_halloween', slug: 'halloween', categories: ['seasonal-holidays'], style: 'pixel-art', difficulty: 'easy' },
  { id: 'col_christmas', slug: 'christmas', categories: ['seasonal-holidays'], style: 'cute', difficulty: 'easy' },
  { id: 'col_spring', slug: 'spring', categories: ['nature', 'seasonal-holidays'], style: 'cute', difficulty: 'easy' },
  { id: 'col_valentines', slug: 'valentines', categories: ['seasonal-holidays'], style: 'kawaii', difficulty: 'easy' },
  { id: 'col_gaming_classics', slug: 'gaming-classics', categories: ['gaming', 'characters'], style: 'pixel-art', difficulty: 'medium' },
  { id: 'col_fantasy_world', slug: 'fantasy-world', categories: ['fantasy-mythical'], style: 'pixel-art', difficulty: 'medium' },
  { id: 'col_emoji', slug: 'emoji', categories: ['objects-symbols', 'characters'], style: 'cute', difficulty: 'easy' },
  { id: 'col_space', slug: 'space', categories: ['objects-symbols', 'fantasy-mythical'], style: 'pixel-art', difficulty: 'easy' },
  { id: 'col_music', slug: 'music', categories: ['objects-symbols'], style: 'pixel-art', difficulty: 'easy' },
  { id: 'col_sports', slug: 'sports', categories: ['objects-symbols'], style: 'pixel-art', difficulty: 'easy' },
  { id: 'col_patriotic', slug: 'patriotic', categories: ['objects-symbols', 'seasonal-holidays'], style: 'pixel-art', difficulty: 'easy' },
  { id: 'col_birthday', slug: 'birthday', categories: ['seasonal-holidays'], style: 'cute', difficulty: 'easy' },
  { id: 'col_letters_numbers', slug: 'letters-numbers', categories: ['objects-symbols'], style: 'pixel-art', difficulty: 'easy' },
] as const;

export const TAGS = [
  'animals', 'food', 'halloween', 'christmas', 'flowers', 'gaming-inspired', 'fantasy',
  'seasonal', 'nature', 'characters', 'pixel-art', 'easy', 'medium', 'hard', 'kawaii', 'cute',
] as const;
