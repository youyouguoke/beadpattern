export type PatternStatus = "draft" | "published" | "archived";
export type GridStatus = "missing" | "designing" | "review" | "ready";
export type Difficulty = "easy" | "medium" | "hard";
export type TagType = "style" | "theme" | "difficulty" | "animal" | "object" | "color" | "season" | "character";
export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";
export type RelatedType = "similar" | "same_collection" | "same_tag" | "same_category" | "manual";
export type BulkJobStatus = "pending" | "processing" | "done" | "failed";
export type MediaType = "cover" | "finished" | "step" | "gallery" | "banner";

export type DifficultyId = 1 | 2 | 3;
export const DIFFICULTY_OPTIONS: { id: DifficultyId; name: string; slug: Difficulty }[] = [
  { id: 1, name: "Easy", slug: "easy" },
  { id: 2, name: "Medium", slug: "medium" },
  { id: 3, name: "Hard", slug: "hard" },
];

export type JsonGrid = (string | number)[][];

export interface ColorPaletteItem {
  hex: string;
  name?: string;
  count?: number;
  code?: string;
}

export interface PatternColor {
  id: string;
  hex: string;
  name: string;
  family?: string;
}

export interface PatternColorUsage {
  colorId: string;
  count: number;
}

export interface PatternStep {
  id: string;
  patternId?: string;
  stepNumber: number;
  description: string;
  image?: string;
  gridData?: JsonGrid;
}

export interface PatternFAQ {
  id: string;
  patternId: string;
  question: string;
  answer: string;
  displayOrder: number;
}

export interface PatternSEO {
  id: string;
  patternId: string;
  title: string;
  description: string;
  keywords: string;
  canonical?: string;
  robots?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatternSEOVariant {
  id: string;
  patternId: string;
  variant: string;
  landingSlug: string;
  searchIntent: SearchIntent;
  displayOrder: number;
  createdAt: string;
}

export interface PatternRelated {
  id: string;
  patternId: string;
  relatedPatternId: string;
  relatedType: RelatedType;
  score: number;
  displayOrder: number;
  createdAt: string;
  relatedPattern?: {
    id: string;
    slug: string;
    title: string;
    coverImage?: string;
  };
}

export interface PatternAudit {
  id: string;
  patternId: string;
  missingCover: boolean;
  missingFaq: boolean;
  missingCollection: boolean;
  missingRelated: boolean;
  missingInternalLinks: boolean;
  ready: boolean;
  published: boolean;
  score: number;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pattern {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  difficultyId?: number;
  status: PatternStatus;
  coverImage?: string;
  finishedImage?: string;
  coverImageR2Key?: string;
  coverMediaId?: string;
  finishedMediaId?: string;
  galleryMediaIds?: string[];
  stepMediaIds?: string[];
  imageUpdatedAt?: string;
  gridSize: string;
  gridData?: JsonGrid;
  estimatedBeads: number;
  colorCount: number;
  colorPalette?: ColorPaletteItem[];
  version: number;
  publishedAt?: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  subject: string;
  style: string;
  season: string;
  estimatedTime: string;
  seoPriority: number;
  publishOrder: number;
  gridStatus: GridStatus;
  gridDesigner: string;
  gridVersion: number;
  gridReviewRequired: boolean;
  gridReviewedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Frontend presentation aliases / form helpers (not stored in DB unless mapped)
  emoji?: string;
  grid?: string; // alias for gridSize
  beadCount?: number; // alias for estimatedBeads
  colors?: number; // alias for colorCount
  views?: number;
  downloads?: number;
  likes?: number;
  keywords?: string[]; // alias for seoKeywords split
  canonical?: string; // alias for SEO canonical
  healthScore?: number;
  healthChecks?: HealthCheck[];
  steps?: PatternStep[]; // only populated on detail
  tags?: { id: string; name: string; slug: string; type?: TagType }[];
  categories?: { id: string; name: string; slug: string }[];
  collections?: { id: string; name: string; slug: string; title: string }[];
  faqs?: PatternFAQ[];
  related?: Pattern[];
  seoVariants?: PatternSEOVariant[];
  audit?: PatternAudit | null; // populated on detail / list when joined

  // Phase 1 import aliases
  categorySlugs?: string[];
  collectionSlugs?: string[];
  tagSlugs?: string[];
  relatedSlugs?: string[];
  coverImageUrl?: string;
  finishedImageUrl?: string;
}

export interface PatternDetail extends Pattern {
  steps: PatternStep[];
  tags: { id: string; name: string; slug: string; type?: TagType }[];
  categories: { id: string; name: string; slug: string }[];
  collections: { id: string; name: string; slug: string; title: string }[];
  faqs: PatternFAQ[];
  related: Pattern[];
  relatedPatterns?: Pattern[];
  seo: PatternSEO | null;
  seoVariants: PatternSEOVariant[];
  audit: PatternAudit | null;
  analytics: {
    views: number;
    likes: number;
    shares: number;
    downloads: number;
    updatedAt?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  patternCount?: number;
  icon?: string; // frontend presentation alias
  count?: number; // frontend presentation alias
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string;
  banner?: string;
  displayOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  patternCount?: number;
  patterns?: { id: string; title: string; slug: string }[];
  // Frontend presentation aliases (not necessarily stored in DB)
  emoji?: string;
  count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;
  displayOrder: number;
  createdAt: string;
  patternCount?: number;
  popularity?: number;
}

export interface Media {
  id: string;
  r2Key?: string;
  url: string;
  type: MediaType;
  size: number;
  width: number;
  height: number;
  usedBy?: Record<string, number>;
  folder?: string;
  altText?: string;
  createdAt: string;
  name?: string; // frontend presentation alias (derived from r2_key)
  thumbnail?: string; // frontend presentation alias (same as url)
}

export interface BulkJob {
  id: string;
  status: BulkJobStatus;
  sourceType: "json" | "csv";
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors?: string[];
  sourceData?: string;
  createdAt: string;
  updatedAt: string;
  name?: string; // frontend presentation alias
  total?: number; // frontend presentation alias
  processed?: number; // frontend presentation alias
  warnings?: number; // frontend presentation alias
  completedAt?: string; // frontend presentation alias
}

export interface BulkImportPreview {
  total: number;
  rows: {
    row: number;
    data: Record<string, unknown>;
    errors: string[];
  }[];
}

export interface BulkImportResult {
  jobId: string;
  total: number;
  processed: number;
  failed: number;
  errors: string[];
}

export interface SeedImportResult {
  dryRun: boolean;
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors?: string[];
  createdSlugs?: string[];
  results?: {
    index: number;
    id: string;
    slug: string;
    title: string;
    status: "created" | "updated";
    errors: string[];
  }[];
}

export interface HealthCheck {
  key: string;
  label: string;
  pass: boolean;
  weight: number;
}

export interface PatternHealth {
  score: number;
  checks: HealthCheck[];
}

export interface DashboardStats {
  patterns: { published: number; draft: number; archived: number; total: number };
  collections: number;
  tags: number;
  media: number;
  bulkJobs: number;
  latestPatterns: Pattern[];
  latestJobs: BulkJob[];
  topDownloaded: { title: string; slug: string; downloads: number }[];
  recentlyUpdated: Pattern[];
  searchTrends: { term: string; count: number }[];
  googleIndex: { indexed: number; submitted: number; pending: number };
  health?: { total: number; missingGrid: number; missingCover: number; missingFaq: number; missingRelated: number };
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Redirect {
  id: string;
  oldUrl: string;
  newUrl: string;
  type: 301 | 302;
}

export interface MetadataTemplate {
  type: "pattern" | "collection" | "tag" | "home";
  titleTemplate: string;
  descriptionTemplate: string;
}

export interface Subscriber {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export interface Sitemap {
  patterns: number;
  collections: number;
  tags: number;
  generatedAt: string | null;
}

export interface Robots {
  allow: string[];
  disallow: string[];
  noindex: boolean;
}

// --- Phase 2 Public API Types ---

export type AnalyticsAction = "view" | "like" | "download" | "share";

export type PatternSort = "newest" | "popular" | "views" | "likes" | "recommended" | "publish_order" | "latest";

export interface PatternListParams {
  page?: number;
  limit?: number;
  q?: string;
  difficulty?: Difficulty | Difficulty[];
  category?: string | string[];
  collection?: string | string[];
  tag?: string | string[];
  theme?: string | string[];
  style?: string | string[];
  season?: string | string[];
  subject?: string | string[];
  grid_size?: string | string[];
  status?: "published";
  sort?: PatternSort;
}

export interface CategoryWithPatterns extends Category {
  patternCount: number;
  patterns: Pattern[];
}

export interface CollectionWithPatterns extends Collection {
  patternCount: number;
  patterns: Pattern[];
}

export interface SearchResult {
  patterns: Pattern[];
  categories: Category[];
  collections: Collection[];
  tags: Tag[];
  query: string;
  total: number;
}

export interface RecommendResult {
  pattern: Pattern;
  related: Pattern[];
  sameCollection: Pattern[];
  sameCategory: Pattern[];
  sameTag: Pattern[];
}

export interface PublicApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}
