"use client";

import type {
  Pattern,
  PatternDetail,
  PatternStep,
  PatternFAQ,
  PatternSEO,
  PatternSEOVariant,
  PatternRelated,
  PatternAudit,
  Category,
  Collection,
  Tag,
  Media,
  BulkJob,
  BulkImportPreview,
  BulkImportResult,
  SeedImportResult,
  PatternHealth,
  DashboardStats,
  Paginated,
  Redirect,
  MetadataTemplate,
  Subscriber,
  Sitemap,
  Robots,
  Difficulty,
  ColorPaletteItem,
  HealthCheck,
  JsonGrid,
} from "@/types";
import { snakeToCamel, camelToSnake, parseJsonGrid, stringifyIfNeeded } from "@/lib/mappers";

export const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8787/api/admin";

export type AdminPatternStatus = Pattern["status"];
export type AdminDifficulty = "Easy" | "Medium" | "Hard";
export type AdminPattern = Pattern;
export type AdminCollection = Collection;
export type AdminCategory = Category;
export type AdminTag = Tag;
export type AdminMedia = Media;
export type AdminBulkJob = BulkJob;
export type AdminDashboardStats = DashboardStats;
export type AdminRedirect = Redirect;
export type AdminMetadataTemplate = MetadataTemplate;
export type AdminSubscriber = Subscriber;
export type AdminSitemap = Sitemap;
export type AdminRobots = Robots;
export type AdminPaginated<T> = Paginated<T>;
export type AdminStep = PatternStep;
export type { HealthCheck };

function getAdminToken(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ?? "";
  return window.localStorage.getItem("admin_token") ?? process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ?? "";
}

function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("admin_token", token);
  else window.localStorage.removeItem("admin_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const url = `${ADMIN_API_BASE}${path.startsWith("/api/admin") ? path : `/api/admin${path}`}`;
  const isFormData = typeof window !== "undefined" && options?.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json();
}

function normalizeDifficulty(difficulty?: string): AdminDifficulty {
  if (!difficulty) return "Easy";
  const normalized = difficulty.trim().toLowerCase();
  if (normalized === "hard") return "Hard";
  if (normalized === "medium") return "Medium";
  return "Easy";
}

function parseColorPalette(raw: unknown): ColorPaletteItem[] | undefined {
  if (!raw) return undefined;
  const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : undefined);
  if (!Array.isArray(arr)) return undefined;
  return arr.map((item) => {
    if (typeof item === "string") return { hex: item };
    return {
      hex: item.hex as string,
      name: item.name as string | undefined,
      count: item.count as number | undefined,
      code: item.code as string | undefined,
    };
  });
}

export function mapPatternRow(p: Record<string, unknown>): Pattern {
  const base = snakeToCamel<Record<string, unknown>>(p);
  return {
    id: (base.id as string) ?? "",
    slug: (base.slug as string) ?? "",
    title: (base.title as string) ?? "",
    description: (base.description as string) ?? "",
    difficulty: (base.difficulty as Difficulty) ?? "easy",
    difficultyId: (base.difficultyId as number) ?? undefined,
    status: (base.status as Pattern["status"]) ?? "draft",
    coverImage: (base.coverImage as string) ?? (base.coverImageUrl as string) ?? undefined,
    finishedImage: (base.finishedImage as string) ?? (base.finishedImageUrl as string) ?? undefined,
    coverImageR2Key: (base.coverImageR2Key as string) ?? undefined,
    coverMediaId: (base.coverMediaId as string) ?? undefined,
    finishedMediaId: (base.finishedMediaId as string) ?? undefined,
    galleryMediaIds: (base.galleryMediaIds as string[]) ?? undefined,
    stepMediaIds: (base.stepMediaIds as string[]) ?? undefined,
    imageUpdatedAt: (base.imageUpdatedAt as string) ?? undefined,
    gridSize: (base.gridSize as string) ?? (base.grid as string) ?? "24x24",
    gridData: parseJsonGrid(base.gridData) ?? parseJsonGrid(base.grid_data),
    estimatedBeads: Number((base.estimatedBeads as number) ?? (base.beadCount as number) ?? 0),
    colorCount: Number((base.colorCount as number) ?? (base.colors as number) ?? 0),
    colorPalette: parseColorPalette(base.colorPalette) ?? parseColorPalette(base.color_palette),
    version: Number(base.version ?? 1),
    publishedAt: (base.publishedAt as string) ?? undefined,
    seoTitle: (base.seoTitle as string) ?? "",
    seoDescription: (base.seoDescription as string) ?? "",
    seoKeywords: (base.seoKeywords as string) ?? (base.keywords as string) ?? "",
    subject: (base.subject as string) ?? "",
    style: (base.style as string) ?? "",
    season: (base.season as string) ?? "",
    estimatedTime: (base.estimatedTime as string) ?? "",
    seoPriority: Number(base.seoPriority ?? 50),
    publishOrder: Number(base.publishOrder ?? 0),
    gridStatus: (base.gridStatus as Pattern["gridStatus"]) ?? "missing",
    gridDesigner: (base.gridDesigner as string) ?? "",
    gridVersion: Number(base.gridVersion ?? 1),
    gridReviewRequired: Boolean(base.gridReviewRequired ?? false),
    gridReviewedAt: (base.gridReviewedAt as string) ?? undefined,
    createdAt: (base.createdAt as string) ?? "",
    updatedAt: (base.updatedAt as string) ?? "",
    healthScore: Number(base.healthScore ?? base.health_score ?? 0),
    healthChecks: ((base.healthChecks ?? base.health_checks) as { name?: string; key?: string; passed?: boolean; pass?: boolean; weight: number }[] | undefined)?.map((hc) => ({
      key: hc.key ?? (hc.name as string) ?? "",
      label: hc.key ?? (hc.name as string) ?? "",
      pass: hc.pass ?? hc.passed ?? false,
      weight: hc.weight,
    })) as HealthCheck[] | undefined,
    audit: base.audit ? mapAuditRow(base.audit as Record<string, unknown>) : undefined,
  };
}

export function mapPatternToBackend(data: Partial<Pattern>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.title !== undefined) out.title = data.title;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.description !== undefined) out.description = data.description;
  if (data.difficulty !== undefined) out.difficulty = data.difficulty.toLowerCase();
  if (data.status !== undefined) out.status = data.status;
  if (data.coverImage !== undefined) out.cover_image = data.coverImage || undefined;
  if (data.finishedImage !== undefined) out.finished_image = data.finishedImage || undefined;
  if (data.coverImageR2Key !== undefined) out.cover_image_r2_key = data.coverImageR2Key || undefined;
  if (data.coverMediaId !== undefined) out.cover_media_id = data.coverMediaId || undefined;
  if (data.finishedMediaId !== undefined) out.finished_media_id = data.finishedMediaId || undefined;
  if (data.galleryMediaIds !== undefined) out.gallery_media_ids = data.galleryMediaIds;
  if (data.stepMediaIds !== undefined) out.step_media_ids = data.stepMediaIds;
  if (data.gridSize !== undefined) out.grid_size = data.gridSize;
  if (data.gridData !== undefined) out.grid_data = stringifyIfNeeded(data.gridData);
  if (data.estimatedBeads !== undefined) out.estimated_beads = data.estimatedBeads;
  if (data.colorCount !== undefined) out.color_count = data.colorCount;
  if (data.colorPalette !== undefined) out.color_palette = data.colorPalette;
  if (data.seoTitle !== undefined) out.seo_title = data.seoTitle;
  if (data.seoDescription !== undefined) out.seo_description = data.seoDescription;
  if (data.seoKeywords !== undefined) out.seo_keywords = data.seoKeywords;
  if (data.subject !== undefined) out.subject = data.subject;
  if (data.style !== undefined) out.style = data.style;
  if (data.season !== undefined) out.season = data.season;
  if (data.estimatedTime !== undefined) out.estimated_time = data.estimatedTime;
  if (data.seoPriority !== undefined) out.seo_priority = data.seoPriority;
  if (data.publishOrder !== undefined) out.publish_order = data.publishOrder;
  if (data.gridStatus !== undefined) out.grid_status = data.gridStatus;
  if (data.gridDesigner !== undefined) out.grid_designer = data.gridDesigner;
  if (data.gridVersion !== undefined) out.grid_version = data.gridVersion;
  if (data.gridReviewRequired !== undefined) out.grid_review_required = data.gridReviewRequired;
  if (data.categorySlugs !== undefined) out.category_slugs = data.categorySlugs;
  if (data.collectionSlugs !== undefined) out.collection_slugs = data.collectionSlugs;
  if (data.tagSlugs !== undefined) out.tag_slugs = data.tagSlugs;
  if (data.relatedSlugs !== undefined) out.related_slugs = data.relatedSlugs;
  if (data.coverImageUrl !== undefined) out.cover_image_url = data.coverImageUrl;
  if (data.finishedImageUrl !== undefined) out.finished_image_url = data.finishedImageUrl;
  if (data.faqs !== undefined) out.faqs = data.faqs;
  if (data.seoVariants !== undefined) out.seo_variants = data.seoVariants;
  return out;
}

export function mapPatternDetailRow(data: Record<string, unknown>): PatternDetail {
  const base = snakeToCamel<Record<string, unknown>>(data);
  // Backend may return either a flat pattern object or a nested { pattern, steps, tags, ... } object.
  const nestedPattern = base.pattern as Record<string, unknown> | undefined;
  const pattern = nestedPattern ? mapPatternRow(nestedPattern) : mapPatternRow(data);
  const tags = (nestedPattern ? (base.tags as Record<string, unknown>[]) : (data.tags as Record<string, unknown>[])) ?? [];
  const categories = (nestedPattern ? (base.categories as Record<string, unknown>[]) : (data.categories as Record<string, unknown>[])) ?? [];
  const collections = (nestedPattern ? (base.collections as Record<string, unknown>[]) : (data.collections as Record<string, unknown>[])) ?? [];
  const steps = (nestedPattern ? (base.steps as Record<string, unknown>[]) : (data.steps as Record<string, unknown>[])) ?? [];
  const faqs = (nestedPattern ? (base.faqs as Record<string, unknown>[]) : (data.faqs as Record<string, unknown>[])) ?? [];
  const related = (nestedPattern ? (base.related as Record<string, unknown>[]) : (data.related as Record<string, unknown>[])) ?? [];
  const seoVariants = (nestedPattern ? (base.seoVariants as Record<string, unknown>[]) : (data.seo_variants as Record<string, unknown>[])) ?? [];
  const seo = (nestedPattern ? base.seo : data.seo) as Record<string, unknown> | undefined;
  const auditRaw = (nestedPattern ? base.audit : data.audit) as Record<string, unknown> | undefined;
  const analyticsRaw = (nestedPattern ? base.analytics : data.analytics) as Record<string, unknown> | undefined;
  return {
    ...pattern,
    steps: steps.map(mapStepRow),
    tags: tags.map((t) => ({ id: t.id as string, name: t.name as string, slug: t.slug as string, type: t.type as Tag["type"] })),
    categories: categories.map((c) => ({ id: c.id as string, name: c.name as string, slug: c.slug as string })),
    collections: collections.map((c) => ({ id: c.id as string, name: c.name as string, slug: c.slug as string, title: c.title as string })),
    faqs: faqs.map(mapFAQRow),
    related: related.map(mapRelatedRow) as unknown as Pattern[],
    seo: seo ? mapSEORow(seo) : null,
    seoVariants: seoVariants.map(mapSEOVariantRow),
    audit: auditRaw ? mapAuditRow(auditRaw) : null,
    analytics: {
      views: Number(analyticsRaw?.views ?? 0),
      likes: Number(analyticsRaw?.likes ?? 0),
      shares: Number(analyticsRaw?.shares ?? 0),
      downloads: Number(analyticsRaw?.downloads ?? 0),
      updatedAt: analyticsRaw?.updatedAt as string | undefined,
    },
  };
}

export function mapStepRow(s: Record<string, unknown>): PatternStep {
  const base = snakeToCamel<Record<string, unknown>>(s);
  return {
    id: (base.id as string) ?? "",
    patternId: (base.patternId as string) ?? "",
    stepNumber: Number(base.stepNumber ?? 0),
    description: (base.description as string) ?? "",
    image: (base.image as string) ?? undefined,
    gridData: parseJsonGrid(base.gridData) ?? parseJsonGrid(base.grid_data),
  };
}

export function mapStepToBackend(data: Partial<PatternStep>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.stepNumber !== undefined) out.step_number = data.stepNumber;
  if (data.description !== undefined) out.description = data.description;
  if (data.image !== undefined) out.image = data.image || undefined;
  if (data.gridData !== undefined) out.grid_data = stringifyIfNeeded(data.gridData);
  return out;
}

export function mapFAQRow(f: Record<string, unknown>): PatternFAQ {
  const base = snakeToCamel<Record<string, unknown>>(f);
  return {
    id: (base.id as string) ?? "",
    patternId: (base.patternId as string) ?? "",
    question: (base.question as string) ?? "",
    answer: (base.answer as string) ?? "",
    displayOrder: Number(base.displayOrder ?? 0),
  };
}

export function mapFAQToBackend(data: Partial<PatternFAQ>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.question !== undefined) out.question = data.question;
  if (data.answer !== undefined) out.answer = data.answer;
  if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
  return out;
}

export function mapSEORow(s: Record<string, unknown>): PatternSEO {
  const base = snakeToCamel<Record<string, unknown>>(s);
  return {
    id: (base.id as string) ?? "",
    patternId: (base.patternId as string) ?? "",
    title: (base.title as string) ?? "",
    description: (base.description as string) ?? "",
    keywords: (base.keywords as string) ?? "",
    canonical: (base.canonical as string) ?? undefined,
    robots: (base.robots as string) ?? undefined,
    ogImage: (base.ogImage as string) ?? undefined,
    twitterTitle: (base.twitterTitle as string) ?? undefined,
    twitterDescription: (base.twitterDescription as string) ?? undefined,
    twitterImage: (base.twitterImage as string) ?? undefined,
    structuredData: (base.structuredData as string) ?? undefined,
    createdAt: (base.createdAt as string) ?? "",
    updatedAt: (base.updatedAt as string) ?? "",
  };
}

export function mapSEOToBackend(data: Partial<PatternSEO>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.title !== undefined) out.title = data.title;
  if (data.description !== undefined) out.description = data.description;
  if (data.keywords !== undefined) out.keywords = data.keywords;
  if (data.canonical !== undefined) out.canonical = data.canonical || undefined;
  if (data.robots !== undefined) out.robots = data.robots || undefined;
  if (data.ogImage !== undefined) out.og_image = data.ogImage || undefined;
  if (data.twitterTitle !== undefined) out.twitter_title = data.twitterTitle || undefined;
  if (data.twitterDescription !== undefined) out.twitter_description = data.twitterDescription || undefined;
  if (data.twitterImage !== undefined) out.twitter_image = data.twitterImage || undefined;
  if (data.structuredData !== undefined) out.structured_data = data.structuredData || undefined;
  return out;
}

export function mapSEOVariantRow(v: Record<string, unknown>): PatternSEOVariant {
  const base = snakeToCamel<Record<string, unknown>>(v);
  return {
    id: (base.id as string) ?? "",
    patternId: (base.patternId as string) ?? "",
    variant: (base.variant as string) ?? "",
    landingSlug: (base.landingSlug as string) ?? "",
    searchIntent: (base.searchIntent as PatternSEOVariant["searchIntent"]) ?? "informational",
    displayOrder: Number(base.displayOrder ?? 0),
    createdAt: (base.createdAt as string) ?? "",
  };
}

export function mapSEOVariantToBackend(data: Partial<PatternSEOVariant>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.variant !== undefined) out.variant = data.variant;
  if (data.landingSlug !== undefined) out.landing_slug = data.landingSlug;
  if (data.searchIntent !== undefined) out.search_intent = data.searchIntent;
  if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
  return out;
}

export function mapRelatedRow(r: Record<string, unknown>): PatternRelated {
  const base = snakeToCamel<Record<string, unknown>>(r);
  return {
    id: (base.id as string) ?? "",
    patternId: (base.patternId as string) ?? "",
    relatedPatternId: (base.relatedPatternId as string) ?? "",
    relatedType: (base.relatedType as PatternRelated["relatedType"]) ?? "similar",
    score: Number(base.score ?? 0),
    displayOrder: Number(base.displayOrder ?? 0),
    createdAt: (base.createdAt as string) ?? "",
    relatedPattern: base.relatedPattern ? {
      id: (base.relatedPattern as Record<string, unknown>).id as string,
      slug: (base.relatedPattern as Record<string, unknown>).slug as string,
      title: (base.relatedPattern as Record<string, unknown>).title as string,
      coverImage: (base.relatedPattern as Record<string, unknown>).cover_image as string | undefined,
    } : undefined,
  };
}

export function mapRelatedToBackend(data: Partial<PatternRelated>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.relatedPatternId !== undefined) out.related_pattern_id = data.relatedPatternId;
  if (data.relatedType !== undefined) out.related_type = data.relatedType;
  if (data.score !== undefined) out.score = data.score;
  if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
  return out;
}

export function mapAuditRow(a: Record<string, unknown>): PatternAudit {
  const base = snakeToCamel<Record<string, unknown>>(a);
  return {
    id: (base.id as string) ?? "",
    patternId: (base.patternId as string) ?? "",
    missingCover: Boolean(base.missingCover ?? true),
    missingFaq: Boolean(base.missingFaq ?? true),
    missingCollection: Boolean(base.missingCollection ?? true),
    missingRelated: Boolean(base.missingRelated ?? true),
    missingInternalLinks: Boolean(base.missingInternalLinks ?? true),
    ready: Boolean(base.ready ?? false),
    published: Boolean(base.published ?? false),
    score: Number(base.score ?? 0),
    checkedAt: (base.checkedAt as string) ?? "",
    createdAt: (base.createdAt as string) ?? "",
    updatedAt: (base.updatedAt as string) ?? "",
  };
}

export function mapCategoryRow(c: Record<string, unknown>): Category {
  const base = snakeToCamel<Record<string, unknown>>(c);
  return {
    id: (base.id as string) ?? "",
    name: (base.name as string) ?? "",
    slug: (base.slug as string) ?? "",
    description: (base.description as string) ?? "",
    displayOrder: Number(base.displayOrder ?? 0),
    createdAt: (base.createdAt as string) ?? "",
    updatedAt: (base.updatedAt as string) ?? "",
    patternCount: Number(base.patternCount ?? 0),
  };
}

export function mapCategoryToBackend(data: Partial<Category>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.description !== undefined) out.description = data.description;
  if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
  return out;
}

export function mapCollectionRow(c: Record<string, unknown>): Collection {
  const base = snakeToCamel<Record<string, unknown>>(c);
  return {
    id: (base.id as string) ?? "",
    title: (base.title as string) ?? "",
    slug: (base.slug as string) ?? "",
    description: (base.description as string) ?? "",
    banner: (base.banner as string) ?? undefined,
    displayOrder: Number(base.displayOrder ?? 0),
    published: Boolean(base.published ?? false),
    createdAt: (base.createdAt as string) ?? "",
    updatedAt: (base.updatedAt as string) ?? "",
    patternCount: Number(base.patternCount ?? 0),
    patterns: (base.patterns as Collection["patterns"]) ?? undefined,
  };
}

export function mapCollectionToBackend(data: Partial<Collection>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.title !== undefined) out.title = data.title;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.description !== undefined) out.description = data.description;
  if (data.banner !== undefined) out.banner = data.banner || null;
  if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
  if (data.published !== undefined) out.published = data.published;
  return out;
}

export function mapTagRow(t: Record<string, unknown>): Tag {
  const base = snakeToCamel<Record<string, unknown>>(t);
  return {
    id: (base.id as string) ?? "",
    name: (base.name as string) ?? "",
    slug: (base.slug as string) ?? "",
    type: (base.type as Tag["type"]) ?? "theme",
    displayOrder: Number(base.displayOrder ?? 0),
    createdAt: (base.createdAt as string) ?? "",
    patternCount: Number((base.count as number) ?? (base.patternCount as number) ?? 0),
    popularity: Number(base.popularity ?? 0),
  };
}

export function mapTagToBackend(data: Partial<Tag>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.type !== undefined) out.type = data.type;
  if (data.displayOrder !== undefined) out.display_order = data.displayOrder;
  return out;
}

export function mapMediaRow(m: Record<string, unknown>): Media {
  const base = snakeToCamel<Record<string, unknown>>(m);
  const url = (base.url as string) ?? "";
  return {
    id: (base.id as string) ?? "",
    r2Key: (base.r2Key as string) ?? undefined,
    url,
    type: (base.type as Media["type"]) ?? "cover",
    size: Number(base.size ?? 0),
    width: Number(base.width ?? 0),
    height: Number(base.height ?? 0),
    usedBy: (base.usedBy as Record<string, number>) ?? undefined,
    folder: (base.folder as string) ?? undefined,
    altText: (base.altText as string) ?? undefined,
    createdAt: (base.createdAt as string) ?? "",
  };
}

export function mapMediaToBackend(data: Partial<Media>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.url !== undefined) out.url = data.url;
  if (data.r2Key !== undefined) out.r2_key = data.r2Key || undefined;
  if (data.type !== undefined) out.type = data.type;
  if (data.folder !== undefined) out.folder = data.folder || undefined;
  if (data.size !== undefined) out.size = data.size;
  if (data.width !== undefined) out.width = data.width;
  if (data.height !== undefined) out.height = data.height;
  if (data.usedBy !== undefined) out.used_by = data.usedBy;
  if (data.altText !== undefined) out.alt_text = data.altText || undefined;
  return out;
}

export function mapBulkJobRow(j: Record<string, unknown>): BulkJob {
  const base = snakeToCamel<Record<string, unknown>>(j);
  return {
    id: (base.id as string) ?? "",
    status: (base.status as BulkJob["status"]) ?? "pending",
    sourceType: (base.sourceType as BulkJob["sourceType"]) ?? "json",
    totalRows: Number((base.totalRows as number) ?? (base.total as number) ?? 0),
    processedRows: Number((base.processedRows as number) ?? (base.processed as number) ?? 0),
    failedRows: Number((base.failedRows as number) ?? (base.errors as number) ?? 0),
    errors: (base.errors as string[]) ?? undefined,
    sourceData: (base.sourceData as string) ?? undefined,
    createdAt: (base.createdAt as string) ?? "",
    updatedAt: (base.updatedAt as string) ?? "",
  };
}

export function mapSubscriberRow(s: Record<string, unknown>): Subscriber {
  const base = snakeToCamel<Record<string, unknown>>(s);
  return { id: (base.id as string) ?? "", email: (base.email as string) ?? "", source: (base.source as string) ?? "", createdAt: (base.createdAt as string) ?? (base.subscribedAt as string) ?? "" };
}

export function mapRedirectRow(r: Record<string, unknown>): Redirect {
  const base = snakeToCamel<Record<string, unknown>>(r);
  return {
    id: String(r.id ?? ""),
    oldUrl: String(r.old_path ?? r.oldUrl ?? ""),
    newUrl: String(r.new_path ?? r.newUrl ?? ""),
    type: (r.code ?? r.type ?? 301) as 301 | 302,
  };
}

export function mapRedirectToBackend(data: Partial<Redirect>): Record<string, unknown> {
  return { old_path: data.oldUrl, new_path: data.newUrl, code: data.type };
}

export function mapSitemapRow(data: Record<string, unknown>): Sitemap {
  const base = snakeToCamel<Record<string, unknown>>(data);
  return {
    patterns: Number(base.patterns ?? 0),
    collections: Number(base.collections ?? 0),
    tags: Number(base.tags ?? 0),
    generatedAt: (base.generatedAt as string | null) ?? null,
  };
}

export function mapMetadataTemplateRow(data: Record<string, unknown>): MetadataTemplate[] {
  const base = snakeToCamel<Record<string, string>>(data);
  const map: Record<string, MetadataTemplate["type"]> = {
    pattern_template: "pattern",
    collection_template: "collection",
    tag_template: "tag",
    home_template: "home",
  };
  return Object.entries(base).map(([key, value]) => ({
    type: map[key] ?? "home",
    titleTemplate: value,
    descriptionTemplate: "",
  }));
}

export function mapMetadataTemplateToBackend(data: Partial<MetadataTemplate>): Record<string, string> {
  const map: Record<MetadataTemplate["type"], string> = { pattern: "pattern_template", collection: "collection_template", tag: "tag_template", home: "home_template" };
  return { [map[data.type ?? "home"]]: data.titleTemplate ?? "" };
}

export const adminService = {
  getAdminToken,
  setAdminToken,

  async login(token: string): Promise<{ authenticated: boolean }> {
    setAdminToken(token);
    const res = await request<{ data: { authenticated: boolean } }>("/auth");
    return res.data;
  },

  logout(): void {
    setAdminToken("");
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await request<{ data: Record<string, unknown> }>("/dashboard");
    const data = snakeToCamel<Record<string, unknown>>(res.data);
    return {
      patterns: (data.patterns as DashboardStats["patterns"]) ?? { total: 0, published: 0, draft: 0, archived: 0 },
      collections: Number(data.collections ?? 0),
      tags: Number(data.tags ?? 0),
      media: Number(data.media ?? 0),
      bulkJobs: Number(data.bulkJobs ?? 0),
      latestPatterns: ((data.latestPatterns as Record<string, unknown>[]) ?? []).map(mapPatternRow),
      latestJobs: ((data.latestJobs as Record<string, unknown>[]) ?? []).map(mapBulkJobRow),
      topDownloaded: (data.topDownloaded as DashboardStats["topDownloaded"]) ?? [],
      recentlyUpdated: ((data.recentlyUpdated as Record<string, unknown>[]) ?? []).map(mapPatternRow),
      searchTrends: (data.searchTrends as DashboardStats["searchTrends"]) ?? [],
      googleIndex: (data.googleIndex as DashboardStats["googleIndex"]) ?? { indexed: 0, submitted: 0, pending: 0 },
    };
  },

  // Patterns
  async listPatterns(params?: { status?: string; difficulty?: string; gridStatus?: string; seoReady?: string; collection?: string; category?: string; tag?: string; q?: string; sort?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.difficulty) query.set("difficulty", params.difficulty.toLowerCase());
    if (params?.gridStatus) query.set("grid_status", params.gridStatus);
    if (params?.seoReady) query.set("seo_ready", params.seoReady);
    if (params?.collection) query.set("collection", params.collection);
    if (params?.category) query.set("category", params.category);
    if (params?.tag) query.set("tag", params.tag);
    if (params?.q) query.set("q", params.q);
    if (params?.sort) query.set("sort", params.sort);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 20));
    const res = await request<Paginated<Record<string, unknown>>>(`/patterns?${query.toString()}`);
    return { data: res.data.map(mapPatternRow), meta: res.meta };
  },

  async getPattern(id: string): Promise<PatternDetail> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${id}`);
    const detail = mapPatternDetailRow(res.data);
    // Backend detail may not include presentation helpers; preserve existing if not stale.
    if (!detail.healthScore && res.data.health_score) {
      detail.healthScore = Number(res.data.health_score);
    }
    if ((!detail.healthChecks || detail.healthChecks.length === 0) && res.data.health_checks) {
      detail.healthChecks = (res.data.health_checks as Record<string, unknown>[]).map((c) => ({
        key: (c.name ?? c.label ?? c.key) as string,
        label: (c.name ?? c.label ?? c.key) as string,
        pass: Boolean(c.pass ?? c.passed),
        weight: Number(c.weight ?? 0),
      }));
    }
    // Flatten backend keywords array into comma-separated string if needed.
    if (Array.isArray(detail.keywords) && !detail.seoKeywords) {
      detail.seoKeywords = detail.keywords.join(", ");
    }
    return detail;
  },

  async getPatternHealth(id: string): Promise<PatternHealth> {
    const res = await request<{ data: { score: number; checks: HealthCheck[] } }>(`/patterns/${id}/health`);
    return res.data;
  },

  async updatePatternStatus(id: string, status: Pattern["status"]): Promise<{ id: string; status: string }> {
    const res = await request<{ data: { id: string; status: string } }>(`/patterns/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    return res.data;
  },

  async publishPattern(id: string): Promise<{ id: string; status: string }> {
    const res = await request<{ data: { id: string; status: string } }>(`/patterns/${id}/publish`, { method: "POST" });
    return res.data;
  },

  async archivePattern(id: string): Promise<{ id: string; status: string }> {
    const res = await request<{ data: { id: string; status: string } }>(`/patterns/${id}/archive`, { method: "POST" });
    return res.data;
  },

  async bulkPublish(ids: string[]): Promise<{ published: number }> {
    const res = await request<{ data: { published: number } }>("/patterns/bulk-publish", { method: "POST", body: JSON.stringify({ ids }) });
    return res.data;
  },

  async bulkArchive(ids: string[]): Promise<{ archived: number }> {
    const res = await request<{ data: { archived: number } }>("/patterns/bulk-archive", { method: "POST", body: JSON.stringify({ ids }) });
    return res.data;
  },

  async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    const res = await request<{ data: { deleted: number } }>("/patterns/bulk-delete", { method: "DELETE", body: JSON.stringify({ ids }) });
    return res.data;
  },

  async createPattern(data: Partial<Pattern>): Promise<Pattern> {
    const res = await request<{ data: Record<string, unknown> }>("/patterns", { method: "POST", body: JSON.stringify(mapPatternToBackend(data)) });
    return mapPatternRow(res.data);
  },

  async updatePattern(id: string, data: Partial<Pattern>): Promise<Pattern> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${id}`, { method: "PUT", body: JSON.stringify(mapPatternToBackend(data)) });
    return mapPatternRow(res.data);
  },

  async deletePattern(id: string): Promise<void> {
    await request(`/patterns/${id}`, { method: "DELETE" });
  },

  // Pattern steps
  async createPatternStep(patternId: string, data: Partial<PatternStep>): Promise<PatternStep> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/steps`, { method: "POST", body: JSON.stringify(mapStepToBackend(data)) });
    return mapStepRow(res.data);
  },

  async updatePatternStep(patternId: string, stepId: string, data: Partial<PatternStep>): Promise<PatternStep> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/steps/${stepId}`, { method: "PUT", body: JSON.stringify(mapStepToBackend(data)) });
    return mapStepRow(res.data);
  },

  async deletePatternStep(patternId: string, stepId: string): Promise<void> {
    await request(`/patterns/${patternId}/steps/${stepId}`, { method: "DELETE" });
  },

  // Pattern FAQs
  async listPatternFAQs(patternId: string): Promise<PatternFAQ[]> {
    const res = await request<{ data: Record<string, unknown>[] }>(`/patterns/${patternId}/faqs`);
    return res.data.map(mapFAQRow);
  },

  async createPatternFAQ(patternId: string, data: Partial<PatternFAQ>): Promise<PatternFAQ> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/faqs`, { method: "POST", body: JSON.stringify(mapFAQToBackend(data)) });
    return mapFAQRow(res.data);
  },

  async updatePatternFAQ(patternId: string, faqId: string, data: Partial<PatternFAQ>): Promise<PatternFAQ> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/faqs/${faqId}`, { method: "PUT", body: JSON.stringify(mapFAQToBackend(data)) });
    return mapFAQRow(res.data);
  },

  async deletePatternFAQ(patternId: string, faqId: string): Promise<void> {
    await request(`/patterns/${patternId}/faqs/${faqId}`, { method: "DELETE" });
  },

  // Pattern related
  async listPatternRelated(patternId: string): Promise<PatternRelated[]> {
    const res = await request<{ data: Record<string, unknown>[] }>(`/patterns/${patternId}/related`);
    return res.data.map(mapRelatedRow);
  },

  async createPatternRelated(patternId: string, data: Partial<PatternRelated>): Promise<PatternRelated> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/related`, { method: "POST", body: JSON.stringify(mapRelatedToBackend(data)) });
    return mapRelatedRow(res.data);
  },

  async deletePatternRelated(patternId: string, relatedId: string): Promise<void> {
    await request(`/patterns/${patternId}/related/${relatedId}`, { method: "DELETE" });
  },

  // Pattern SEO
  async updatePatternSEO(patternId: string, data: Partial<PatternSEO>): Promise<PatternSEO> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/seo`, { method: "PUT", body: JSON.stringify(mapSEOToBackend(data)) });
    return mapSEORow(res.data);
  },

  // Pattern SEO variants
  async listPatternSEOVariants(patternId: string): Promise<PatternSEOVariant[]> {
    const res = await request<{ data: Record<string, unknown>[] }>(`/patterns/${patternId}/seo-variants`);
    return res.data.map(mapSEOVariantRow);
  },

  async createPatternSEOVariant(patternId: string, data: Partial<PatternSEOVariant>): Promise<PatternSEOVariant> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/seo-variants`, { method: "POST", body: JSON.stringify(mapSEOVariantToBackend(data)) });
    return mapSEOVariantRow(res.data);
  },

  async updatePatternSEOVariant(patternId: string, variantId: string, data: Partial<PatternSEOVariant>): Promise<PatternSEOVariant> {
    const res = await request<{ data: Record<string, unknown> }>(`/patterns/${patternId}/seo-variants/${variantId}`, { method: "PUT", body: JSON.stringify(mapSEOVariantToBackend(data)) });
    return mapSEOVariantRow(res.data);
  },

  async deletePatternSEOVariant(patternId: string, variantId: string): Promise<void> {
    await request(`/patterns/${patternId}/seo-variants/${variantId}`, { method: "DELETE" });
  },

  // Pattern audit
  async getPatternAudit(patternId: string): Promise<PatternAudit | null> {
    const res = await request<{ data: Record<string, unknown> | null }>(`/patterns/${patternId}/audit`);
    return res.data ? mapAuditRow(res.data) : null;
  },

  // Collections
  async listCollections(params?: { q?: string; published?: string; page?: number; limit?: number }): Promise<Paginated<Collection>> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.published) query.set("published", params.published);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 20));
    const res = await request<Paginated<Record<string, unknown>>>(`/collections?${query.toString()}`);
    return { data: res.data.map(mapCollectionRow), meta: res.meta };
  },

  async getCollection(id: string): Promise<Collection> {
    const res = await request<{ data: Record<string, unknown> }>(`/collections/${id}`);
    return mapCollectionRow(res.data);
  },

  async createCollection(data: Partial<Collection>): Promise<Collection> {
    const res = await request<{ data: Record<string, unknown> }>("/collections", { method: "POST", body: JSON.stringify(mapCollectionToBackend(data)) });
    return mapCollectionRow(res.data);
  },

  async updateCollection(id: string, data: Partial<Collection>): Promise<Collection> {
    const res = await request<{ data: Record<string, unknown> }>(`/collections/${id}`, { method: "PUT", body: JSON.stringify(mapCollectionToBackend(data)) });
    return mapCollectionRow(res.data);
  },

  async deleteCollection(id: string): Promise<void> {
    await request(`/collections/${id}`, { method: "DELETE" });
  },

  async setCollectionPatterns(id: string, patternIds?: string[], removePatternIds?: string[]): Promise<void> {
    await request(`/collections/${id}/patterns`, { method: "POST", body: JSON.stringify({ pattern_ids: patternIds, remove_pattern_ids: removePatternIds }) });
  },

  async listCollectionPatterns(id: string, page = 1, limit = 20): Promise<Paginated<{ id: string; slug: string; title: string; coverImage?: string; status: string; createdAt: string }>> {
    const res = await request<Paginated<Record<string, unknown>>>(`/collections/${id}/patterns?page=${page}&limit=${limit}`);
    return { data: res.data.map((r) => snakeToCamel(r as Record<string, unknown>) as { id: string; slug: string; title: string; coverImage?: string; status: string; createdAt: string }), meta: res.meta };
  },

  // Categories
  async listCategories(params?: { q?: string; page?: number; limit?: number }): Promise<Paginated<Category>> {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 20));
    const res = await request<Paginated<Record<string, unknown>>>(`/categories?${query.toString()}`);
    return { data: res.data.map(mapCategoryRow), meta: res.meta };
  },

  async getCategory(id: string): Promise<Category> {
    const res = await request<{ data: Record<string, unknown> }>(`/categories/${id}`);
    return mapCategoryRow(res.data);
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await request<{ data: Record<string, unknown> }>("/categories", { method: "POST", body: JSON.stringify(mapCategoryToBackend(data)) });
    return mapCategoryRow(res.data);
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await request<{ data: Record<string, unknown> }>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(mapCategoryToBackend(data)) });
    return mapCategoryRow(res.data);
  },

  async deleteCategory(id: string): Promise<void> {
    await request(`/categories/${id}`, { method: "DELETE" });
  },

  async setCategoryPatterns(id: string, patternIds?: string[], removePatternIds?: string[]): Promise<void> {
    await request(`/categories/${id}/patterns`, { method: "POST", body: JSON.stringify({ pattern_ids: patternIds, remove_pattern_ids: removePatternIds }) });
  },

  async listCategoryPatterns(id: string, page = 1, limit = 20): Promise<Paginated<{ id: string; slug: string; title: string; coverImage?: string; status: string; createdAt: string }>> {
    const res = await request<Paginated<Record<string, unknown>>>(`/categories/${id}/patterns?page=${page}&limit=${limit}`);
    return { data: res.data.map((r) => snakeToCamel(r as Record<string, unknown>) as { id: string; slug: string; title: string; coverImage?: string; status: string; createdAt: string }), meta: res.meta };
  },

  // Tags
  async listTags(params?: { type?: string; page?: number; limit?: number }): Promise<Paginated<Tag>> {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 100));
    const res = await request<Paginated<Record<string, unknown>>>(`/tags?${query.toString()}`);
    return { data: res.data.map(mapTagRow), meta: res.meta };
  },

  async getTag(id: string): Promise<Tag> {
    const res = await request<{ data: Record<string, unknown> }>(`/tags/${id}`);
    return mapTagRow(res.data);
  },

  async createTag(data: Partial<Tag>): Promise<Tag> {
    const res = await request<{ data: Record<string, unknown> }>("/tags", { method: "POST", body: JSON.stringify(mapTagToBackend(data)) });
    return mapTagRow(res.data);
  },

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const res = await request<{ data: Record<string, unknown> }>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(mapTagToBackend(data)) });
    return mapTagRow(res.data);
  },

  async deleteTag(id: string): Promise<void> {
    await request(`/tags/${id}`, { method: "DELETE" });
  },

  async mergeTags(sourceId: string, targetId: string): Promise<void> {
    await request(`/tags/${sourceId}/merge`, { method: "POST", body: JSON.stringify({ target_tag_id: targetId }) });
  },

  // Media
  async listMedia(params?: { folder?: string; type?: string; q?: string; page?: number; limit?: number }): Promise<Paginated<Media>> {
    const query = new URLSearchParams();
    if (params?.folder) query.set("folder", params.folder);
    if (params?.type) query.set("type", params.type);
    if (params?.q) query.set("q", params.q);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 20));
    const res = await request<Paginated<Record<string, unknown>>>(`/media?${query.toString()}`);
    return { data: res.data.map(mapMediaRow), meta: res.meta };
  },

  async createMedia(data: Partial<Media>): Promise<Media> {
    const res = await request<{ data: Record<string, unknown> }>("/media", { method: "POST", body: JSON.stringify(mapMediaToBackend(data)) });
    return mapMediaRow(res.data);
  },

  async getMedia(id: string): Promise<Media> {
    const res = await request<{ data: Record<string, unknown> }>(`/media/${id}`);
    return mapMediaRow(res.data);
  },

  async updateMedia(id: string, data: Partial<Media>): Promise<Media> {
    const res = await request<{ data: Record<string, unknown> }>(`/media/${id}`, { method: "PUT", body: JSON.stringify(mapMediaToBackend(data)) });
    return mapMediaRow(res.data);
  },

  async uploadMediaImage(file: File, type: Media["type"] = "cover"): Promise<Media> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    const res = await request<{ data: Record<string, unknown> }>("/media/upload-image", { method: "POST", body: form });
    return mapMediaRow(res.data);
  },

  async deleteMedia(id: string): Promise<void> {
    await request(`/media/${id}`, { method: "DELETE" });
  },

  async listMediaFolders(): Promise<string[]> {
    const res = await request<{ data: string[] }>("/media/folders");
    return res.data;
  },

  // Bulk Import
  async listBulkJobs(page = 1, limit = 20): Promise<Paginated<BulkJob>> {
    const res = await request<Paginated<Record<string, unknown>>>(`/bulk/jobs?page=${page}&limit=${limit}`);
    return { data: res.data.map(mapBulkJobRow), meta: res.meta };
  },

  async getBulkJob(id: string): Promise<BulkJob> {
    const res = await request<{ data: Record<string, unknown> }>(`/bulk/jobs/${id}`);
    return mapBulkJobRow(res.data);
  },

  async previewBulkImport(sourceType: "csv" | "json", sourceData: string): Promise<BulkImportPreview> {
    const res = await request<{ data: BulkImportPreview }>("/bulk/import/preview", { method: "POST", body: JSON.stringify({ source_type: sourceType, source_data: sourceData }) });
    return res.data;
  },

  async createBulkImport(sourceType: "csv" | "json", sourceData: string): Promise<BulkImportResult> {
    const res = await request<{ data: BulkImportResult }>("/bulk/import/create", { method: "POST", body: JSON.stringify({ source_type: sourceType, source_data: sourceData }) });
    return res.data;
  },

  async publishBulkImport(slugs?: string[], all = false): Promise<{ published: number }> {
    const res = await request<{ data: { published: number } }>("/bulk/import/publish", { method: "POST", body: JSON.stringify({ slugs, all }) });
    return res.data;
  },

  // Seed Import
  async seedImport(patterns: Record<string, unknown>[], dryRun = false): Promise<SeedImportResult> {
    const res = await request<{ data: SeedImportResult }>("/seed-import", { method: "POST", body: JSON.stringify({ patterns, dry_run: dryRun }) });
    return res.data;
  },

  // SEO
  async getSitemap(): Promise<Sitemap> {
    const res = await request<{ data: Record<string, unknown> }>("/seo/sitemap");
    return mapSitemapRow(res.data);
  },

  async regenerateSitemap(): Promise<Sitemap> {
    const res = await request<{ data: Record<string, unknown> }>("/seo/sitemap/regenerate");
    return mapSitemapRow(res.data);
  },

  async listMetadata(): Promise<MetadataTemplate[]> {
    const res = await request<{ data: Record<string, string> }>("/seo/metadata");
    return mapMetadataTemplateRow(res.data);
  },

  async updateMetadata(data: MetadataTemplate[]): Promise<void> {
    const body: Record<string, string> = {};
    for (const item of data) Object.assign(body, mapMetadataTemplateToBackend(item));
    await request("/seo/metadata", { method: "PUT", body: JSON.stringify(body) });
  },

  async listRedirects(page = 1, limit = 20): Promise<Paginated<Redirect>> {
    const res = await request<Paginated<Record<string, unknown>>>(`/seo/redirects?page=${page}&limit=${limit}`);
    return { data: res.data.map(mapRedirectRow), meta: res.meta };
  },

  async createRedirect(data: Partial<Redirect>): Promise<Redirect> {
    const res = await request<{ data: Record<string, unknown> }>("/seo/redirects", { method: "POST", body: JSON.stringify(mapRedirectToBackend(data)) });
    return mapRedirectRow(res.data);
  },

  async updateRedirect(id: string, data: Partial<Redirect>): Promise<Redirect> {
    const res = await request<{ data: Record<string, unknown> }>(`/seo/redirects/${id}`, { method: "PUT", body: JSON.stringify(mapRedirectToBackend(data)) });
    return mapRedirectRow(res.data);
  },

  async deleteRedirect(id: string): Promise<void> {
    await request(`/seo/redirects/${id}`, { method: "DELETE" });
  },

  async updateRobots(data: Robots): Promise<void> {
    await request("/seo/robots", { method: "PUT", body: JSON.stringify({ allow: data.allow, disallow: data.disallow, noindex: data.noindex }) });
  },

  // Analytics
  async listAnalyticsPatterns(params?: { from?: string; to?: string; page?: number; limit?: number }): Promise<Paginated<Record<string, unknown>>> {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 20));
    const res = await request<Paginated<Record<string, unknown>>>(`/analytics/patterns?${query.toString()}`);
    return { data: res.data.map((r) => snakeToCamel(r as Record<string, unknown>)), meta: res.meta };
  },

  async getPatternStats(id: string): Promise<{ pattern: { id: string; slug: string; title: string }; totals: { views: number; likes: number; shares: number; downloads: number }; last7Days: unknown[]; last30Days: unknown[] }> {
    const res = await request<{ data: { pattern: { id: string; slug: string; title: string }; totals: { views: number; likes: number; shares: number; downloads: number }; last_7_days: unknown[]; last_30_days: unknown[] } }>(`/analytics/patterns/${id}`);
    return { ...res.data, last7Days: res.data.last_7_days, last30Days: res.data.last_30_days };
  },

  async getSearchKeywords(): Promise<string[]> {
    const res = await request<{ data: string[] }>("/analytics/search-keywords");
    return res.data;
  },

  // Newsletter
  async listSubscribers(params?: { source?: string; page?: number; limit?: number }): Promise<Paginated<Subscriber>> {
    const query = new URLSearchParams();
    if (params?.source) query.set("source", params.source);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 20));
    const res = await request<Paginated<Record<string, unknown>>>(`/newsletter/subscribers?${query.toString()}`);
    return { data: res.data.map(mapSubscriberRow), meta: res.meta };
  },

  async exportSubscribers(): Promise<string> {
    const res = await request<{ data: { csv: string } }>("/newsletter/subscribers/export");
    return res.data.csv;
  },

  async deleteSubscriber(id: string): Promise<void> {
    await request(`/newsletter/subscribers/${id}`, { method: "DELETE" });
  },

  // Settings
  async listSettings(): Promise<Record<string, string>> {
    const res = await request<{ data: Record<string, string | null> }>("/settings");
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(res.data)) if (value !== null) result[key] = value;
    return result;
  },

  async updateSettings(settings: Record<string, string>): Promise<Record<string, string>> {
    const res = await request<{ data: Record<string, string> }>("/settings", { method: "PUT", body: JSON.stringify({ values: settings }) });
    return res.data;
  },
};
