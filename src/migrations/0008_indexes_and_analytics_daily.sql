-- Scale-oriented indexes for 1M patterns
CREATE INDEX IF NOT EXISTS idx_patterns_status_created_at
  ON patterns(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patterns_difficulty_created_at
  ON patterns(difficulty, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patterns_status_published_at
  ON patterns(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_tags_tag_pattern
  ON pattern_tags(tag_id, pattern_id);

-- Action log lifecycle / cleanup
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at
  ON action_logs(created_at);

-- Analytics sharded by day to avoid row-level contention on a single hot row
CREATE TABLE IF NOT EXISTS analytics_daily (
  pattern_id TEXT NOT NULL,
  date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (pattern_id, date),
  FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE
);

-- Index for per-pattern rollups
CREATE INDEX IF NOT EXISTS idx_analytics_daily_pattern_date
  ON analytics_daily(pattern_id, date DESC);

-- Pre-aggregated totals (optional; rebuild from analytics_daily periodically)
CREATE TABLE IF NOT EXISTS analytics_summary (
  pattern_id TEXT PRIMARY KEY,
  views_total INTEGER NOT NULL DEFAULT 0,
  likes_total INTEGER NOT NULL DEFAULT 0,
  shares_total INTEGER NOT NULL DEFAULT 0,
  downloads_total INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE CASCADE
);
