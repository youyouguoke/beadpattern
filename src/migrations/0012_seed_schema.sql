-- 0012 seed migration schema additions (idempotent)
-- Adds editorial/production fields to patterns and supporting tables for FAQ, related patterns,
-- programmatic SEO variants, and content audit tracking.

-- 0010 already created collections and categories; columns may already exist if the prior failed migration partially ran.
-- Those columns are already verified to exist in the current local DB, so skip the ALTER TABLE statements here.
-- Only ensure the seed data is inserted into categories/collections and create the missing tables.

-- Taxonomy tables (created by 0010 first; keep IF NOT EXISTS to remain safe for idempotent runs)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 0010 already created collections with `title` instead of `name`; ensure the column exists for seeding.
-- This migration will typically be applied on a fresh DB where columns already exist, so the ADD COLUMN statements are intentionally removed.
-- If run on an empty DB, title is the canonical column and name is optional.

-- Seed categories
INSERT OR IGNORE INTO categories (id, name, slug, description, display_order) VALUES
('cat_animals', 'Animals', 'animals', 'Furry, feathered, and fantastic animal bead patterns.', 1),
('cat_characters', 'Characters', 'characters', 'Pop culture, mascots, and original character designs.', 2),
('cat_food', 'Food & Drink', 'food-drink', 'Delicious kawaii food and beverage patterns.', 3),
('cat_nature', 'Nature', 'nature', 'Flowers, plants, trees, and natural landscapes.', 4),
('cat_gaming', 'Gaming', 'gaming', 'Video game sprites, characters, and gaming icons.', 5),
('cat_seasonal', 'Seasonal & Holidays', 'seasonal-holidays', 'Year-round holiday and seasonal celebration patterns.', 6),
('cat_fantasy', 'Fantasy & Mythical', 'fantasy-mythical', 'Dragons, unicorns, fairies, and magical creatures.', 7),
('cat_objects', 'Objects & Symbols', 'objects-symbols', 'Everyday items, emojis, symbols, and decorative motifs.', 8);

-- 0010 created collections with `title` column. In case this migration runs before 0010 or after a partial application, ensure name/title compatibility by inserting into the columns that actually exist. This INSERT targets columns guaranteed to exist in the 0010 schema (id, title, slug, description, display_order).
-- Seed collections
INSERT OR IGNORE INTO collections (id, title, slug, description, display_order) VALUES
('col_cute_animals', 'Cute Animals Collection', 'cute-animals', 'Adorable animal patterns for beginners.', 1),
('col_pocket_pets', 'Pocket Pets Collection', 'pocket-pets', 'Tiny critters that fit in your pocket.', 2),
('col_farm_friends', 'Farm Friends Collection', 'farm-friends', 'Friendly farmyard animals.', 3),
('col_ocean_life', 'Ocean Life Collection', 'ocean-life', 'Under the sea creatures.', 4),
('col_safari', 'Safari Collection', 'safari', 'African safari animals.', 5),
('col_baby_animals', 'Baby Animals Collection', 'baby-animals', 'The cutest baby creatures.', 6),
('col_foodie_kawaii', 'Foodie Kawaii Collection', 'foodie-kawaii', 'Delicious kawaii food art.', 7),
('col_halloween', 'Halloween Collection', 'halloween', 'Spooky and fun Halloween designs.', 8),
('col_christmas', 'Christmas Collection', 'christmas', 'Festive holiday patterns.', 9),
('col_spring', 'Spring Collection', 'spring', 'Fresh spring flowers and themes.', 10),
('col_valentines', 'Valentine''s Collection', 'valentines', 'Love and heart themed patterns.', 11),
('col_gaming_classics', 'Gaming Classics Collection', 'gaming-classics', 'Retro and classic gaming sprites.', 12),
('col_fantasy_world', 'Fantasy World Collection', 'fantasy-world', 'Magical and mythical designs.', 13),
('col_emoji', 'Emoji Collection', 'emoji', 'Popular emoji expressions and symbols.', 14),
('col_space', 'Space Collection', 'space', 'Stars, planets, and cosmic patterns.', 15),
('col_music', 'Music Collection', 'music', 'Musical instruments and symbols.', 16),
('col_sports', 'Sports Collection', 'sports', 'Sports themed designs.', 17),
('col_patriotic', 'Patriotic Collection', 'patriotic', 'National flag and patriotic designs.', 18),
('col_birthday', 'Birthday Collection', 'birthday', 'Celebration and birthday patterns.', 19),
('col_letters_numbers', 'Letters & Numbers Collection', 'letters-numbers', 'Alphabet and number patterns.', 20);

-- Pattern FAQs
CREATE TABLE IF NOT EXISTS pattern_faqs (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pattern_id, question)
);

CREATE INDEX IF NOT EXISTS idx_pattern_faqs_pattern_id ON pattern_faqs(pattern_id);

-- Related patterns graph (internal linking)
CREATE TABLE IF NOT EXISTS pattern_related (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  related_pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  related_type TEXT NOT NULL DEFAULT 'similar' CHECK (related_type IN ('similar','same_collection','same_tag','same_category','manual')),
  score REAL NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pattern_id, related_pattern_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_related_pattern_id ON pattern_related(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_related_related_pattern_id ON pattern_related(related_pattern_id);

-- Programmatic SEO keyword variants
CREATE TABLE IF NOT EXISTS pattern_seo_variants (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  landing_slug TEXT NOT NULL,
  search_intent TEXT NOT NULL DEFAULT 'informational' CHECK (search_intent IN ('informational','commercial','transactional','navigational')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pattern_id, landing_slug)
);

CREATE INDEX IF NOT EXISTS idx_pattern_seo_variants_pattern_id ON pattern_seo_variants(pattern_id);

-- Content production audit / readiness
CREATE TABLE IF NOT EXISTS pattern_audit (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL UNIQUE REFERENCES patterns(id) ON DELETE CASCADE,
  missing_cover BOOLEAN NOT NULL DEFAULT 1,
  missing_faq BOOLEAN NOT NULL DEFAULT 1,
  missing_collection BOOLEAN NOT NULL DEFAULT 1,
  missing_related BOOLEAN NOT NULL DEFAULT 1,
  missing_internal_links BOOLEAN NOT NULL DEFAULT 1,
  ready BOOLEAN NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
