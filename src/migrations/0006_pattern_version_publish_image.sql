-- Schema evolution P0: versioning, publish time, image storage
ALTER TABLE patterns ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE patterns ADD COLUMN published_at TEXT;
ALTER TABLE patterns ADD COLUMN finished_image TEXT;
ALTER TABLE patterns ADD COLUMN cover_image_r2_key TEXT;
ALTER TABLE patterns ADD COLUMN image_updated_at TEXT;

-- Backfill published_at for already-published patterns so existing data stays valid
UPDATE patterns SET published_at = created_at WHERE status = 'published' AND published_at IS NULL;

-- Index for the canonical "Newest / Freshness / Trending" ordering
CREATE INDEX IF NOT EXISTS idx_patterns_status_published_at
  ON patterns(status, published_at DESC);

-- Index for slug lookups (explicit, even though UNIQUE already creates one)
CREATE INDEX IF NOT EXISTS idx_patterns_slug ON patterns(slug);
