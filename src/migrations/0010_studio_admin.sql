-- Studio Admin migration 0010

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  banner TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_published ON collections(published);

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

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  r2_key TEXT UNIQUE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('cover', 'finished', 'step', 'gallery', 'banner')),
  size INTEGER,
  width INTEGER,
  height INTEGER,
  used_by TEXT, -- JSON object mapping resource type to count
  folder TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_folder ON media(folder);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);

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

-- newsletter_subscribers exists from 0005; add source/subscribed_at if missing.
ALTER TABLE newsletter_subscribers ADD COLUMN source TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN subscribed_at TEXT;
