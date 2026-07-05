-- P1 schema changes: difficulty table, SEO table, color tables, pattern difficulty_id
CREATE TABLE IF NOT EXISTS difficulties (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL,
  display_order INTEGER NOT NULL
);

INSERT OR IGNORE INTO difficulties (id, name, slug, level, display_order) VALUES
(1, 'Easy', 'easy', 1, 1),
(2, 'Medium', 'medium', 2, 2),
(3, 'Hard', 'hard', 3, 3);

ALTER TABLE patterns ADD COLUMN difficulty_id INTEGER DEFAULT 1;

UPDATE patterns SET difficulty_id = CASE difficulty
  WHEN 'easy' THEN 1
  WHEN 'medium' THEN 2
  WHEN 'hard' THEN 3
  ELSE 1
END;

CREATE INDEX IF NOT EXISTS idx_patterns_difficulty_id ON patterns(difficulty_id);
CREATE INDEX IF NOT EXISTS idx_patterns_difficulty_id_published_at ON patterns(difficulty_id, published_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_pattern_colors_color_id ON pattern_colors(color_id);

-- Seed colors from existing distinct color_palette hex values where possible.
-- Simple fallback: only parse when color_palette is valid JSON containing #hex strings.
INSERT OR IGNORE INTO colors (id, hex, name, family)
SELECT
  lower(hex),
  lower(hex),
  NULL,
  NULL
FROM (
  SELECT DISTINCT value AS hex
  FROM patterns,
       json_each(color_palette)
  WHERE json_valid(color_palette) = 1
    AND json_type(color_palette) = 'array'
) AS derived
WHERE hex LIKE '#%'
  AND length(hex) = 7;
