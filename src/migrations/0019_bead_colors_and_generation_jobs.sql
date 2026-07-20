-- Migration 0019: Add bead color palette and generation job queue

-- Real-world bead color palette (Perler + Artkal)
CREATE TABLE IF NOT EXISTS bead_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,              -- e.g. Perler, Artkal
  code TEXT NOT NULL,               -- e.g. P01, A023
  name TEXT NOT NULL,               -- e.g. White, Dark Blue
  hex TEXT NOT NULL,                -- #rrggbb
  available INTEGER NOT NULL DEFAULT 1,
  aliases TEXT,                     -- JSON ["blanc", "weiss"]
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bead_colors_brand_code ON bead_colors(brand, code);
CREATE INDEX IF NOT EXISTS idx_bead_colors_hex ON bead_colors(hex);

-- Generation job queue for batch pattern asset production
CREATE TABLE IF NOT EXISTS generation_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_id TEXT NOT NULL,         -- references patterns.id
  stage TEXT NOT NULL,              -- dsl, grid, optimize, score, assets, upload, db
  status TEXT NOT NULL,             -- pending, processing, done, failed
  error TEXT,
  metadata TEXT,                    -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_pattern_id ON generation_jobs(pattern_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_stage ON generation_jobs(stage);

-- Seed Perler and Artkal common colors (small starter set, ~40 colors)
INSERT OR IGNORE INTO bead_colors (brand, code, name, hex) VALUES
('Perler', 'P01', 'White', '#ffffff'),
('Perler', 'P02', 'Black', '#000000'),
('Perler', 'P03', 'Red', '#ff0000'),
('Perler', 'P04', 'Orange', '#ff7f00'),
('Perler', 'P05', 'Yellow', '#ffff00'),
('Perler', 'P06', 'Green', '#00aa00'),
('Perler', 'P07', 'Dark Green', '#006400'),
('Perler', 'P08', 'Blue', '#0066ff'),
('Perler', 'P09', 'Dark Blue', '#00008b'),
('Perler', 'P10', 'Purple', '#800080'),
('Perler', 'P11', 'Pink', '#ff69b4'),
('Perler', 'P12', 'Light Pink', '#ffb6c1'),
('Perler', 'P13', 'Brown', '#8b4513'),
('Perler', 'P14', 'Tan', '#d2b48c'),
('Perler', 'P15', 'Cream', '#fffdd0'),
('Perler', 'P16', 'Gray', '#808080'),
('Perler', 'P17', 'Light Gray', '#d3d3d3'),
('Perler', 'P18', 'Beige', '#f5f5dc'),
('Perler', 'P19', 'Cyan', '#00ffff'),
('Perler', 'P20', 'Magenta', '#ff00ff'),
('Artkal', 'A01', 'White', '#ffffff'),
('Artkal', 'A02', 'Black', '#1a1a1a'),
('Artkal', 'A03', 'Red', '#e60012'),
('Artkal', 'A04', 'Orange', '#f39800'),
('Artkal', 'A05', 'Yellow', '#fff100'),
('Artkal', 'A06', 'Green', '#009944'),
('Artkal', 'A07', 'Dark Green', '#004d25'),
('Artkal', 'A08', 'Blue', '#0068b7'),
('Artkal', 'A09', 'Dark Blue', '#1d2088'),
('Artkal', 'A10', 'Purple', '#7d1189'),
('Artkal', 'A11', 'Pink', '#f19db4'),
('Artkal', 'A12', 'Light Pink', '#f6c2d8'),
('Artkal', 'A13', 'Brown', '#8f5e35'),
('Artkal', 'A14', 'Tan', '#c9a063'),
('Artkal', 'A15', 'Cream', '#fffcd6'),
('Artkal', 'A16', 'Gray', '#7f7f7f'),
('Artkal', 'A17', 'Light Gray', '#c9c9c9'),
('Artkal', 'A18', 'Beige', '#efe8d3'),
('Artkal', 'A19', 'Cyan', '#00a0e9'),
('Artkal', 'A20', 'Magenta', '#e4007f');
