export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyLevel = 1 | 2 | 3;
export type PatternStatus = 'draft' | 'published' | 'archived';
export type TagType = 'style' | 'theme' | 'difficulty' | 'animal' | 'object' | 'color' | 'season' | 'character';
export type JobStatus = 'pending' | 'processing' | 'done' | 'failed';
export type BulkSourceType = 'csv' | 'json';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;
  display_order: number;
  created_at: string;
}

export interface PatternStep {
  id: string;
  pattern_id: string;
  step_number: number;
  description: string | null;
  image: string | null;
  grid_data: string | null; // JSON string
}

export interface PatternColor {
  name: string;
  code?: string;
  hex: string;
  count?: number;
}

export interface PatternSeo {
  id: string;
  pattern_id: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  canonical: string | null;
  robots: string | null;
  og_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  structured_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface Color {
  id: string;
  hex: string;
  name: string | null;
  family: string | null;
}

export interface PatternColorRow {
  id: string;
  pattern_id: string;
  color_id: string;
  count: number;
}

export interface Pattern {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: Difficulty;
  difficulty_id: number;
  status: PatternStatus;
  version: number;
  published_at: string | null;
  cover_image: string | null;
  finished_image: string | null;
  cover_image_r2_key: string | null;
  image_updated_at: string | null;
  grid_size: string | null; // e.g. "29x29"
  grid_data: string | null; // JSON array of array of color indices or hex strings
  estimated_beads: number | null;
  color_count: number | null;
  color_palette: string | null; // JSON array of hex strings or PatternColor objects
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatternAnalytics {
  pattern_id: string;
  views: number;
  likes: number;
  shares: number;
  downloads: number;
  updated_at: string;
}

export interface PatternTagRelation {
  pattern_id: string;
  tag_id: string;
}

export interface BulkJob {
  id: string;
  status: JobStatus;
  source_type: BulkSourceType;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  errors: string | null; // JSON array
  source_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatternWithDetails extends Pattern {
  tags: Tag[];
  steps: PatternStep[];
  analytics: PatternAnalytics | null;
}

export interface PatternListItem extends Pattern {
  tags: string[];
  views: number;
}
