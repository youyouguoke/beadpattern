-- Make sure the FTS5 table exists (idempotent if already created by 0001_init)
CREATE VIRTUAL TABLE IF NOT EXISTS pattern_search USING fts5(title, description, content='patterns', content_rowid='rowid');

-- Populate initial data if the table is empty
INSERT INTO pattern_search (rowid, title, description)
SELECT rowid, title, description FROM patterns
WHERE (SELECT COUNT(*) FROM pattern_search) = 0;

-- Triggers to keep the FTS5 index in sync with the patterns table
CREATE TRIGGER IF NOT EXISTS pattern_search_insert
AFTER INSERT ON patterns
BEGIN
  INSERT INTO pattern_search (rowid, title, description)
  VALUES (NEW.rowid, NEW.title, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS pattern_search_update
AFTER UPDATE ON patterns
BEGIN
  INSERT OR REPLACE INTO pattern_search (rowid, title, description)
  VALUES (NEW.rowid, NEW.title, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS pattern_search_delete
AFTER DELETE ON patterns
BEGIN
  DELETE FROM pattern_search WHERE rowid = OLD.rowid;
END;
