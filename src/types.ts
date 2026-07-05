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

export type MinimalSeo = Pick<PatternSeo, 'title' | 'description'>;

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

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  banner: string | null;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type MediaType = 'cover' | 'finished' | 'step' | 'gallery' | 'banner';

export interface Media {
  id: string;
  r2_key: string | null;
  url: string;
  type: MediaType | null;
  size: number | null;
  width: number | null;
  height: number | null;
  used_by: string | null; // JSON object
  folder: string | null;
  created_at: string;
}

export interface Redirect {
  id: string;
  old_path: string;
  new_path: string;
  code: 301 | 302;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string | null;
  updated_at: string;
}

export interface PatternCollection {
  pattern_id: string;
  collection_id: string;
  display_order: number;
}

export interface PatternCategory {
  pattern_id: string;
  category_id: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string | null;
  subscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthCheck {
  name: string;
  passed: boolean;
  weight: number;
  detail?: string;
}

export interface HealthResult {
  score: number;
  checks: HealthCheck[];
}
