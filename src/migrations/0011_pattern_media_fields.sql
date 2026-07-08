-- Add pattern media associations for gallery and step images
ALTER TABLE patterns ADD COLUMN gallery_media_ids TEXT;
ALTER TABLE patterns ADD COLUMN step_media_ids TEXT;

-- Track which media items are used by patterns (cover/finished/gallery/step)
ALTER TABLE media ADD COLUMN alt_text TEXT;

-- Optional: explicit cover/finished media_id if user wants to select from library
ALTER TABLE patterns ADD COLUMN cover_media_id TEXT;
ALTER TABLE patterns ADD COLUMN finished_media_id TEXT;
