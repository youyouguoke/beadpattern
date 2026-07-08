-- 0014: Add missing pattern columns for seed-import and admin APIs.
-- Applied to remote DB which already has 0001, 0006, 0009, 0011 columns.
-- Adds only the columns currently missing on the remote patterns table.

ALTER TABLE patterns ADD COLUMN subject TEXT;
ALTER TABLE patterns ADD COLUMN style TEXT;
ALTER TABLE patterns ADD COLUMN season TEXT;
ALTER TABLE patterns ADD COLUMN grid_status TEXT DEFAULT 'missing' CHECK (grid_status IN ('missing','designing','review','ready'));
ALTER TABLE patterns ADD COLUMN grid_designer TEXT;
ALTER TABLE patterns ADD COLUMN grid_version INTEGER DEFAULT 1;
ALTER TABLE patterns ADD COLUMN grid_review_required INTEGER DEFAULT 0;
ALTER TABLE patterns ADD COLUMN estimated_time TEXT;
ALTER TABLE patterns ADD COLUMN seo_priority INTEGER DEFAULT 50;
ALTER TABLE patterns ADD COLUMN publish_order INTEGER DEFAULT 0;
ALTER TABLE patterns ADD COLUMN grid_reviewed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_patterns_grid_status ON patterns(grid_status);
CREATE INDEX IF NOT EXISTS idx_patterns_seo_priority ON patterns(seo_priority);
CREATE INDEX IF NOT EXISTS idx_patterns_publish_order ON patterns(publish_order);
CREATE INDEX IF NOT EXISTS idx_patterns_cover_media_id ON patterns(cover_media_id);
CREATE INDEX IF NOT EXISTS idx_patterns_finished_media_id ON patterns(finished_media_id);
