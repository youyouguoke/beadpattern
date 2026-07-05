-- Tag display ordering for admin / home / hot tags
ALTER TABLE tags ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

-- Hot/popular tag queries and ordered listing
CREATE INDEX IF NOT EXISTS idx_tags_display_order ON tags(display_order ASC, name ASC);
