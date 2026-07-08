export const initSchema = `CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS difficulties (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  style TEXT,
  season TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  difficulty_id INTEGER DEFAULT 1 REFERENCES difficulties(id) ON DELETE SET DEFAULT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,
  cover_image TEXT,
  finished_image TEXT,
  cover_image_r2_key TEXT,
  cover_media_id TEXT,
  finished_media_id TEXT,
  gallery_media_ids TEXT,
  step_media_ids TEXT,
  image_updated_at TEXT,
  grid_size TEXT,
  estimated_beads INTEGER,
  color_count INTEGER,
  color_palette TEXT,
  grid_data TEXT,
  grid_status TEXT NOT NULL DEFAULT 'missing' CHECK (grid_status IN ('missing','designing','review','ready')),
  grid_designer TEXT,
  grid_version INTEGER NOT NULL DEFAULT 1,
  grid_review_required BOOLEAN NOT NULL DEFAULT 0,
  grid_reviewed_at TEXT,
  estimated_time TEXT,
  seo_priority INTEGER NOT NULL DEFAULT 50,
  publish_order INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pattern_steps (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT,
  image TEXT,
  grid_data TEXT,
  UNIQUE (pattern_id, step_number)
);

CREATE TABLE IF NOT EXISTS pattern_tags (
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, tag_id)
);

CREATE TABLE IF NOT EXISTS analytics (
  pattern_id TEXT PRIMARY KEY REFERENCES patterns(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pattern_seo (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL UNIQUE REFERENCES patterns(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  keywords TEXT,
  canonical TEXT,
  robots TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  structured_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS colors (
  id TEXT PRIMARY KEY,
  hex TEXT NOT NULL UNIQUE,
  name TEXT,
  family TEXT
);

CREATE TABLE IF NOT EXISTS pattern_colors (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  color_id TEXT NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (pattern_id, color_id)
);

CREATE INDEX IF NOT EXISTS idx_patterns_status ON patterns(status);
CREATE INDEX IF NOT EXISTS idx_patterns_difficulty ON patterns(difficulty);
CREATE INDEX IF NOT EXISTS idx_patterns_difficulty_id ON patterns(difficulty_id);
CREATE INDEX IF NOT EXISTS idx_patterns_difficulty_id_published_at ON patterns(difficulty_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_created_at ON patterns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_tags_tag_id ON pattern_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_pattern_steps_pattern_id ON pattern_steps(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_colors_color_id ON pattern_colors(color_id);
CREATE INDEX IF NOT EXISTS idx_tags_display_order ON tags(display_order ASC, name ASC);
CREATE INDEX IF NOT EXISTS idx_pattern_tags_tag_id ON pattern_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_patterns_seo_priority ON patterns(seo_priority DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_publish_order ON patterns(publish_order ASC);
CREATE INDEX IF NOT EXISTS idx_patterns_subject ON patterns(subject);
CREATE INDEX IF NOT EXISTS idx_patterns_style ON patterns(style);
CREATE INDEX IF NOT EXISTS idx_patterns_season ON patterns(season);
CREATE INDEX IF NOT EXISTS idx_patterns_grid_status ON patterns(grid_status);

CREATE VIRTUAL TABLE IF NOT EXISTS pattern_search USING fts5(title, description, content='patterns', content_rowid='rowid');

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

INSERT OR IGNORE INTO tags (id, name, slug, type) VALUES
('tag_animals', 'Animals', 'animals', 'theme'),
('tag_food', 'Food', 'food', 'theme'),
('tag_halloween', 'Halloween', 'halloween', 'season'),
('tag_christmas', 'Christmas', 'christmas', 'season'),
('tag_flowers', 'Flowers', 'flowers', 'theme'),
('tag_gaming', 'Gaming Inspired', 'gaming-inspired', 'theme'),
('tag_fantasy', 'Fantasy', 'fantasy', 'theme'),
('tag_seasonal', 'Seasonal', 'seasonal', 'season'),
('tag_nature', 'Nature', 'nature', 'theme'),
('tag_characters', 'Characters', 'characters', 'theme'),
('tag_pixel_art', 'Pixel Art', 'pixel-art', 'style'),
('tag_easy', 'Easy', 'easy', 'difficulty'),
('tag_medium', 'Medium', 'medium', 'difficulty'),
('tag_hard', 'Hard', 'hard', 'difficulty'),
('tag_kawaii', 'Kawaii', 'kawaii', 'style'),
('tag_cute', 'Cute', 'cute', 'style'),
('tag_objects', 'Objects', 'objects', 'theme'),
('tag_retro', 'Retro', 'retro', 'style');

INSERT OR IGNORE INTO difficulties (id, name, slug, level, display_order) VALUES
(1, 'Easy', 'easy', 1, 1),
(2, 'Medium', 'medium', 2, 2),
(3, 'Hard', 'hard', 3, 3);`;
// Phase 1 taxonomy seeding (matches 0012_seed_schema.sql additions)
export const categoriesSeed = `INSERT OR IGNORE INTO categories (id, name, slug, description, display_order) VALUES
('cat_animals', 'Animals', 'animals', 'Furry, feathered, and fantastic animal bead patterns.', 1),
('cat_characters', 'Characters', 'characters', 'Pop culture, mascots, and original character designs.', 2),
('cat_food', 'Food & Drink', 'food-drink', 'Delicious kawaii food and beverage patterns.', 3),
('cat_nature', 'Nature', 'nature', 'Flowers, plants, trees, and natural landscapes.', 4),
('cat_gaming', 'Gaming', 'gaming', 'Video game sprites, characters, and gaming icons.', 5),
('cat_seasonal', 'Seasonal & Holidays', 'seasonal-holidays', 'Year-round holiday and seasonal celebration patterns.', 6),
('cat_fantasy', 'Fantasy & Mythical', 'fantasy-mythical', 'Dragons, unicorns, fairies, and magical creatures.', 7),
('cat_objects', 'Objects & Symbols', 'objects-symbols', 'Everyday items, emojis, symbols, and decorative motifs.', 8);`;

export const collectionsSeed = `INSERT OR IGNORE INTO collections (id, name, slug, description, display_order) VALUES
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
('col_letters_numbers', 'Letters & Numbers Collection', 'letters-numbers', 'Alphabet and number patterns.', 20);`;

export const actionLogsSchema = `CREATE TABLE IF NOT EXISTS action_logs (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_action_logs_lookup
  ON action_logs(pattern_id, action_type, fingerprint, created_at);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  r2_key TEXT UNIQUE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('cover', 'finished', 'step', 'gallery', 'banner')),
  size INTEGER,
  width INTEGER,
  height INTEGER,
  used_by TEXT,
  folder TEXT,
  alt_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_folder ON media(folder);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_r2_key ON media(r2_key);

CREATE TABLE IF NOT EXISTS redirects (
  id TEXT PRIMARY KEY,
  old_path TEXT NOT NULL UNIQUE,
  new_path TEXT NOT NULL,
  code INTEGER NOT NULL DEFAULT 301 CHECK (code IN (301, 302)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_redirects_old_path ON redirects(old_path);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pattern_collections (
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (pattern_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_collections_collection_id ON pattern_collections(collection_id);

CREATE TABLE IF NOT EXISTS pattern_categories (
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_categories_category_id ON pattern_categories(category_id);

CREATE TABLE IF NOT EXISTS bulk_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  source_type TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  errors TEXT,
  source_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  source TEXT,
  subscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
);`;

export const fts5Triggers = `CREATE TRIGGER IF NOT EXISTS pattern_search_insert AFTER INSERT ON patterns BEGIN
  INSERT INTO pattern_search (rowid, title, description)
  VALUES (NEW.rowid, NEW.title, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS pattern_search_update AFTER UPDATE ON patterns BEGIN
  UPDATE pattern_search SET title = NEW.title, description = NEW.description
  WHERE rowid = NEW.rowid;
END;

CREATE TRIGGER IF NOT EXISTS pattern_search_delete AFTER DELETE ON patterns BEGIN
  DELETE FROM pattern_search WHERE rowid = OLD.rowid;
END;`;

function minifySql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

export async function applyMigrations(db: D1Database) {
  for (const sql of [initSchema, actionLogsSchema, fts5Triggers]) {
    await db.exec(minifySql(sql));
  }
  await db.exec(minifySql(categoriesSeed));
  await db.exec(minifySql(collectionsSeed));
}

// Phase 1 seed-pack taxonomy (collections + tags) used by frontend sample data.
export const phase1CollectionsSeed = `INSERT OR IGNORE INTO collections (id, title, slug, description, display_order) VALUES
('col_kawaii', 'Kawaii Collection', 'kawaii-collection', 'Cute and kawaii bead patterns.', 21),
('col_gaming', 'Gaming Collection', 'gaming-collection', 'Video game and pixel art bead patterns.', 22),
('col_charm', 'Charm Collection', 'charm-collection', 'Small charm-sized bead patterns.', 23),
('col_flower', 'Flower Collection', 'flower-collection', 'Floral and flower bead patterns.', 24),
('col_nature', 'Nature Collection', 'nature-collection', 'Nature themed bead patterns.', 25),
('col_retro', 'Retro Collection', 'retro-collection', 'Retro and vintage style bead patterns.', 26),
('col_valentine', 'Valentine Collection', 'valentine-collection', 'Love and Valentine themed bead patterns.', 27),
('col_rainbow', 'Rainbow Collection', 'rainbow-collection', 'Rainbow and colorful bead patterns.', 28),
('col_halloween', 'Halloween Collection', 'halloween-collection', 'Spooky and fun Halloween designs.', 29);`;

export const phase1TagsSeed = `INSERT OR IGNORE INTO tags (id, name, slug, type) VALUES
('tag_panda', 'Panda', 'panda', 'subject'),
('tag_mario', 'Mario', 'mario', 'subject'),
('tag_gaming', 'Gaming', 'gaming', 'theme'),
('tag_mushroom', 'Mushroom', 'mushroom', 'subject'),
('tag_cat', 'Cat', 'cat', 'subject'),
('tag_sleepy', 'Sleepy', 'sleepy', 'style'),
('tag_ghost', 'Ghost', 'ghost', 'subject'),
('tag_pumpkin', 'Pumpkin', 'pumpkin', 'subject'),
('tag_flower', 'Flower', 'flower', 'subject'),
('tag_sunflower', 'Sunflower', 'sunflower', 'subject'),
('tag_tulip', 'Tulip', 'tulip', 'subject'),
('tag_daisy', 'Daisy', 'daisy', 'subject'),
('tag_bee', 'Bee', 'bee', 'subject'),
('tag_insect', 'Insect', 'insect', 'subject'),
('tag_butterfly', 'Butterfly', 'butterfly', 'subject'),
('tag_ladybug', 'Ladybug', 'ladybug', 'subject'),
('tag_smiley', 'Smiley', 'smiley', 'subject'),
('tag_heart', 'Heart', 'heart', 'subject'),
('tag_love', 'Love', 'love', 'theme'),
('tag_rainbow', 'Rainbow', 'rainbow', 'theme'),
('tag_colors', 'Colors', 'colors', 'theme'),
('tag_charm', 'Charm', 'charm', 'type'),
('tag_small', 'Small', 'small', 'size'),
('tag_mini', 'Mini', 'mini', 'size'),
('tag_bamboo', 'Bamboo', 'bamboo', 'subject');`;

export function getMigrationsForLocal(): string[] {
  return [initSchema, actionLogsSchema, fts5Triggers, categoriesSeed, collectionsSeed, phase1CollectionsSeed, phase1TagsSeed].map(minifySql);
}
