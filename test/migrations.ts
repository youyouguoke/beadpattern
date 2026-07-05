export const initSchema = `CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,
  cover_image TEXT,
  finished_image TEXT,
  cover_image_r2_key TEXT,
  image_updated_at TEXT,
  grid_size TEXT,
  estimated_beads INTEGER,
  color_count INTEGER,
  color_palette TEXT,
  grid_data TEXT,
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

CREATE INDEX IF NOT EXISTS idx_patterns_status ON patterns(status);
CREATE INDEX IF NOT EXISTS idx_patterns_difficulty ON patterns(difficulty);
CREATE INDEX IF NOT EXISTS idx_patterns_created_at ON patterns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_tags_tag_id ON pattern_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_pattern_steps_pattern_id ON pattern_steps(pattern_id);

CREATE VIRTUAL TABLE IF NOT EXISTS pattern_search USING fts5(title, description, content='patterns', content_rowid='rowid');

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
('tag_cute', 'Cute', 'cute', 'style');`;

export const actionLogsSchema = `CREATE TABLE IF NOT EXISTS action_logs (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_action_logs_lookup
  ON action_logs(pattern_id, action_type, fingerprint, created_at);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
}
