import type {
  Category,
  Collection,
  Pattern,
  PatternDetail,
  PatternListParams,
  PublicApiResponse,
  RecommendResult,
  SearchResult,
  Tag,
} from "@/types";

export type { Category, Collection, Pattern, PatternDetail, PatternListParams, PublicApiResponse, RecommendResult, SearchResult, Tag };

export const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL || "https://api.beadpatternai.com/api";

async function fetchPublicApi<T>(path: string, init?: RequestInit): Promise<PublicApiResponse<T>> {
  const res = await fetch(`${PUBLIC_API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => ({ success: false, error: { code: "PARSE_ERROR", message: "Invalid JSON" } }));
  if (!res.ok && !data.error) {
    return { success: false, data: undefined as unknown as T, error: { code: `HTTP_${res.status}`, message: res.statusText } };
  }
  return data as PublicApiResponse<T>;
}

// Phase 2 public endpoints (mock fallback until backend ready)

export async function getPublishedPatterns(params: PatternListParams = {}): Promise<Pattern[]> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  if (params.difficulty) search.set("difficulty", normalizeArray(params.difficulty).join(","));
  if (params.category) search.set("category", normalizeArray(params.category).join(","));
  if (params.collection) search.set("collection", normalizeArray(params.collection).join(","));
  if (params.tag) search.set("tag", normalizeArray(params.tag).join(","));
  if (params.style) search.set("style", normalizeArray(params.style).join(","));
  if (params.season) search.set("season", normalizeArray(params.season).join(","));
  if (params.subject) search.set("subject", normalizeArray(params.subject).join(","));
  if (params.grid_size) search.set("grid_size", normalizeArray(params.grid_size).join(","));
  if (params.sort) search.set("sort", params.sort);
  search.set("status", "published");

  const res = await fetchPublicApi<{ items: Record<string, unknown>[] } | Record<string, unknown>[]>(`/patterns?${search.toString()}`);
  if (res.success && res.data) {
    const raw = res.data as { items?: Record<string, unknown>[] } | Record<string, unknown>[];
    const items = Array.isArray(raw) ? raw : raw.items ?? [];
    return items.map(mapPattern);
  }
  return [];
}

export async function getPatternBySlug(slug: string): Promise<PatternDetail | null> {
  const res = await fetchPublicApi<Record<string, unknown>>(`/patterns/${slug}`, { cache: "no-store" });
  if (!res.success || !res.data) return null;

  const data = res.data as Record<string, unknown>;
  const rawPattern = (data.pattern ?? data) as Record<string, unknown>;
  const pattern = mapPattern(rawPattern) as PatternDetail;

  const parseArray = (v: unknown): unknown[] | undefined => {
    if (Array.isArray(v)) return v as unknown[];
    if (typeof v === "string" && v.trim()) {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const coverMedia = data.cover_media;
  const finishedMedia = data.finished_media;
  if (!pattern.coverImage && coverMedia && typeof coverMedia === "object") {
    pattern.coverImage = (coverMedia as Record<string, unknown>).url as string | undefined;
  }
  if (!pattern.finishedImage && finishedMedia && typeof finishedMedia === "object") {
    pattern.finishedImage = (finishedMedia as Record<string, unknown>).url as string | undefined;
  }

  pattern.steps = Array.isArray(data.steps)
    ? data.steps.map((s: Record<string, unknown>) => ({
        id: String(s.id || ""),
        patternId: String(s.pattern_id || s.patternId || ""),
        stepNumber: Number(s.step_number || s.stepNumber || 0),
        description: String(s.description || ""),
        image: s.image_url ? String(s.image_url) : s.image ? String(s.image) : undefined,
        gridData: parseArray(s.grid_data || s.gridData) as Pattern["gridData"],
      }))
    : [];

  pattern.faqs = Array.isArray(data.faqs)
    ? data.faqs.map((f: Record<string, unknown>) => ({
        id: String(f.id || ""),
        patternId: String(f.pattern_id || f.patternId || ""),
        question: String(f.question || ""),
        answer: String(f.answer || ""),
        displayOrder: Number(f.display_order || f.displayOrder || 0),
      }))
    : [];

  pattern.related = Array.isArray(rawPattern.related_patterns)
    ? (rawPattern.related_patterns as Record<string, unknown>[]).map((r) => mapPattern(r))
    : [];

  return pattern;
}

export async function getRecommendedPatterns(slug: string): Promise<RecommendResult> {
  const res = await fetchPublicApi<RecommendResult>(`/recommend/${encodeURIComponent(slug)}`);
  if (res.success && res.data) {
    const data = res.data as unknown as Record<string, unknown> | Record<string, unknown>[];
    // Backend currently returns { data: Pattern[] } for /recommend/:slug
    if (Array.isArray(data)) {
      return {
        pattern: {} as Pattern,
        related: data.map((p) => mapPattern(p as Record<string, unknown>)),
        sameCollection: [],
        sameCategory: [],
        sameTag: [],
      } as RecommendResult;
    }
    return {
      pattern: mapPattern((data.pattern ?? {}) as Record<string, unknown>),
      related: Array.isArray(data.related) ? data.related.map((p) => mapPattern(p as Record<string, unknown>)) : [],
      sameCollection: Array.isArray(data.sameCollection) ? data.sameCollection.map((p) => mapPattern(p as Record<string, unknown>)) : [],
      sameCategory: Array.isArray(data.sameCategory) ? data.sameCategory.map((p) => mapPattern(p as Record<string, unknown>)) : [],
      sameTag: Array.isArray(data.sameTag) ? data.sameTag.map((p) => mapPattern(p as Record<string, unknown>)) : [],
    } as RecommendResult;
  }
  return {
    pattern: {} as Pattern,
    related: [],
    sameCollection: [],
    sameCategory: [],
    sameTag: [],
  };
}

export async function searchPatterns(params: { q: string; page?: number; limit?: number; filters?: Record<string, string | string[]> }): Promise<SearchResult> {
  const search = new URLSearchParams();
  search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      search.set(key, Array.isArray(value) ? value.join(",") : value);
    }
  }
  const res = await fetchPublicApi<SearchResult>(`/search?${search.toString()}`);
  if (res.success && res.data) {
    const data = res.data as unknown as Record<string, unknown>;
    return {
      patterns: Array.isArray(data.patterns) ? data.patterns.map((p) => mapPattern(p as Record<string, unknown>)) : [],
      categories: Array.isArray(data.categories) ? data.categories : [] as Category[],
      collections: Array.isArray(data.collections) ? data.collections : [] as Collection[],
      tags: Array.isArray(data.tags) ? data.tags : [] as Tag[],
      query: (data.query as string) || params.q,
      total: Number(data.total ?? 0),
    } as SearchResult;
  }
  return {
    patterns: [],
    categories: [],
    collections: [],
    tags: [],
    query: params.q,
    total: 0,
  };
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetchPublicApi<Category[]>("/categories");
  return res.success ? res.data : [];
}

export async function getCategoryBySlug(slug: string): Promise<{ category: Category; patterns: Pattern[] } | null> {
  const res = await fetchPublicApi<{ category: Category; patterns: Record<string, unknown>[] }>(`/categories/${slug}`);
  if (res.success && res.data) {
    return {
      category: res.data.category,
      patterns: res.data.patterns.map(mapPattern),
    };
  }
  return null;
}

function mapCollection(input: Record<string, unknown>): Collection {
  return {
    id: String(input.id || input.slug || ""),
    title: String(input.title || ""),
    slug: String(input.slug || ""),
    description: String(input.description || ""),
    banner: input.banner ? String(input.banner) : undefined,
    displayOrder: Number(input.display_order || input.displayOrder || 0),
    published: Boolean(input.published ?? 1),
    createdAt: String(input.created_at || input.createdAt || ""),
    updatedAt: String(input.updated_at || input.updatedAt || ""),
    patternCount: Number(input.pattern_count || input.patternCount || 0),
    count: Number(input.pattern_count || input.patternCount || 0),
    emoji: String(input.emoji || ""),
  } as Collection;
}

export async function getCollections(): Promise<Collection[]> {
  const res = await fetchPublicApi<Collection[]>("/collections");
  return res.success && res.data ? (res.data as unknown as Record<string, unknown>[]).map(mapCollection) : [];
}

export async function getCollectionBySlug(slug: string): Promise<{ collection: Collection; patterns: Pattern[] } | null> {
  const res = await fetchPublicApi<{ collection: Record<string, unknown>; patterns: Record<string, unknown>[] }>(`/collections/${slug}`);
  if (res.success && res.data) {
    return {
      collection: mapCollection(res.data.collection),
      patterns: res.data.patterns.map(mapPattern),
    };
  }
  return null;
}

export async function recordAnalytics(slug: string, action: "view" | "like" | "download" | "share"): Promise<void> {
  await fetchPublicApi<unknown>(`/patterns/${slug}/${action}`, { method: "POST" }).catch(() => null);
}

export interface PatternDownload {
  url: string;
  filename: string;
  contentType: string;
  note?: string;
}

export interface PatternDownloadPngResponse {
  url: string;
  filename: string;
  content_type: string;
}

export interface PatternDownloadPdfResponse {
  url: string;
  filename: string;
  content_type: string;
  note?: string;
}

export async function downloadPatternPng(slug: string): Promise<PatternDownload> {
  const res = await fetchPublicApi<PatternDownloadPngResponse>(`/patterns/${encodeURIComponent(slug)}/download/png`);
  if (!res.success || !res.data) throw new Error(res.error?.message || "PNG download unavailable");
  return { url: res.data.url, filename: res.data.filename, contentType: res.data.content_type || "image/svg+xml" };
}

export async function downloadPatternPdf(slug: string): Promise<PatternDownload> {
  const res = await fetchPublicApi<PatternDownloadPdfResponse>(`/patterns/${encodeURIComponent(slug)}/download/pdf`);
  if (!res.success || !res.data) throw new Error(res.error?.message || "PDF download unavailable");
  return { url: res.data.url, filename: res.data.filename, contentType: res.data.content_type || "application/pdf", note: res.data.note };
}

export async function getSitemapData(): Promise<{ patterns: { slug: string; updatedAt?: string }[]; collections: { slug: string }[]; categories: { slug: string }[] }> {
  const [patternsRes, categoriesRes, collectionsRes] = await Promise.all([
    fetchPublicApi<{ slugs: { slug: string; updatedAt?: string }[] }>("/sitemap/patterns"),
    fetchPublicApi<{ slugs: { slug: string }[] }>("/sitemap/tags"),
    fetchPublicApi<{ slugs: { slug: string }[] }>("/sitemap/difficulty"),
  ]);
  return {
    patterns: patternsRes.success ? patternsRes.data.slugs : [],
    categories: categoriesRes.success ? categoriesRes.data.slugs : [],
    collections: collectionsRes.success ? collectionsRes.data.slugs : [],
  };
}

function mapPattern(input: Record<string, unknown>): Pattern {
  const p = input;
  const get = (camel: string, snake: string): unknown => {
    if (p[camel] !== undefined) return p[camel];
    if (p[snake] !== undefined) return p[snake];
    return undefined;
  };

  const parseArray = (v: unknown): unknown[] | undefined => {
    if (Array.isArray(v)) return v as unknown[];
    if (typeof v === "string" && v.trim()) {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const colorPalette = parseArray(get("colorPalette", "color_palette"));
  const gridData = parseArray(get("gridData", "grid_data"));

  return {
    ...p,
    id: (get("id", "id") as string) ?? "",
    slug: (get("slug", "slug") as string) ?? "",
    title: (get("title", "title") as string) ?? "",
    description: (get("description", "description") as string) ?? "",
    difficulty: (get("difficulty", "difficulty") as Pattern["difficulty"]) ?? "easy",
    status: (get("status", "status") as Pattern["status"]) ?? "draft",
    coverImage: get("coverImage", "cover_image") as string | undefined,
    finishedImage: get("finishedImage", "finished_image") as string | undefined,
    gridSize: (get("gridSize", "grid_size") as string) ?? (get("grid", "grid") as string) ?? "",
    gridData: gridData as Pattern["gridData"],
    estimatedBeads: Number(get("estimatedBeads", "estimated_beads") ?? get("beadCount", "bead_count") ?? 0) || (gridData ? gridData.length * ((gridData[0] as { length?: number })?.length || 0) : 0),
    colorCount: Number(get("colorCount", "color_count") ?? colorPalette?.length ?? 0),
    colorPalette: colorPalette as Pattern["colorPalette"],
    version: Number(get("version", "version") || 1),
    views: Number(get("views", "views") || 0),
    likes: Number(get("likes", "likes") || 0),
    downloads: Number(get("downloads", "downloads") || 0),
    seoTitle: (get("seoTitle", "seo_title") as string) ?? "",
    seoDescription: (get("seoDescription", "seo_description") as string) ?? "",
    seoKeywords: (get("seoKeywords", "seo_keywords") as string) ?? "",
    subject: (get("subject", "subject") as string) ?? "",
    style: (get("style", "style") as string) ?? "",
    season: (get("season", "season") as string) ?? "",
    estimatedTime: (get("estimatedTime", "estimated_time") as string) ?? "",
    seoPriority: Number(get("seoPriority", "seo_priority") || 0),
    publishOrder: Number(get("publishOrder", "publish_order") || 0),
    gridStatus: (get("gridStatus", "grid_status") as Pattern["gridStatus"]) ?? "missing",
    gridDesigner: (get("gridDesigner", "grid_designer") as string) ?? "",
    gridVersion: Number(get("gridVersion", "grid_version") || 1),
    gridReviewRequired: Boolean(get("gridReviewRequired", "grid_review_required")),
    gridReviewedAt: get("gridReviewedAt", "grid_reviewed_at") as string | undefined,
    publishedAt: get("publishedAt", "published_at") as string | undefined,
    createdAt: (get("createdAt", "created_at") as string) ?? "",
    updatedAt: (get("updatedAt", "updated_at") as string) ?? "",
    tags: Array.isArray(get("tags", "tags")) ? (get("tags", "tags") as Pattern["tags"]) : undefined,
    categories: Array.isArray(get("categories", "categories"))
      ? (get("categories", "categories") as Pattern["categories"])
      : undefined,
    collections: Array.isArray(get("collections", "collections"))
      ? (get("collections", "collections") as Pattern["collections"])
      : undefined,
    audit: get("audit", "audit") as Pattern["audit"],
    relatedPatterns: Array.isArray(get("related_patterns", "related_patterns"))
      ? (get("related_patterns", "related_patterns") as unknown[]).map((r) => mapPattern(r as Record<string, unknown>))
      : undefined,
    } as Pattern;
    }

    function normalizeArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}
