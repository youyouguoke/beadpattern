"use client";

export const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || "/api/admin";

export type AdminPatternStatus = "published" | "draft" | "archived";
export type AdminDifficulty = "Easy" | "Medium" | "Hard";

export interface AdminPattern {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  description: string;
  difficulty: AdminDifficulty;
  grid: string;
  beadCount: number;
  colors: number;
  status: AdminPatternStatus;
  coverImage?: string;
  finishedImage?: string;
  tags: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
  collections: { name: string; slug: string }[];
  steps: AdminStep[];
  seoTitle: string;
  seoDescription: string;
  canonical?: string;
  keywords: string[];
  views: number;
  downloads: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  healthScore: number;
  healthChecks: HealthCheck[];
}

export interface AdminStep {
  id: string;
  stepNumber: number;
  description: string;
  image?: string;
  gridData?: string;
}

export interface HealthCheck {
  label: string;
  pass: boolean;
}

export interface AdminCollection {
  id: string;
  slug: string;
  title: string;
  description: string;
  banner?: string;
  displayOrder: number;
  published: boolean;
  patternCount: number;
  patterns: { id: string; title: string; slug: string }[];
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  count: number;
}

export interface AdminTag {
  id: string;
  slug: string;
  name: string;
  popularity: number;
  patternCount: number;
}

export interface AdminMedia {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  folder: string;
  size: number;
  width: number;
  height: number;
  usedBy?: { type: string; title: string; slug: string }[];
  createdAt: string;
}

export interface AdminBulkJob {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  total: number;
  processed: number;
  errors: number;
  warnings: number;
  createdAt: string;
  completedAt?: string;
}

export interface AdminDashboardStats {
  patterns: { published: number; draft: number; archived: number; total: number };
  collections: number;
  tags: number;
  media: number;
  bulkJobs: number;
  latestPatterns: AdminPattern[];
  latestJobs: AdminBulkJob[];
  topDownloaded: { title: string; slug: string; downloads: number }[];
  recentlyUpdated: AdminPattern[];
  searchTrends: { term: string; count: number }[];
  googleIndex: { indexed: number; submitted: number; pending: number };
}

export interface AdminRedirect {
  id: string;
  oldUrl: string;
  newUrl: string;
  type: 301 | 302;
}

export interface AdminMetadataTemplate {
  type: "pattern" | "collection" | "tag" | "home";
  titleTemplate: string;
  descriptionTemplate: string;
}

export interface AdminSubscriber {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export interface AdminSetting {
  key: string;
  value: string;
}

const MOCK_DELAY = 300;

const mockPatterns: AdminPattern[] = [
  {
    id: "p1",
    slug: "cute-frog",
    title: "Cute Frog",
    emoji: "🐸",
    description: "A cute frog drinking bubble tea.",
    difficulty: "Easy",
    grid: "32x32",
    beadCount: 842,
    colors: 12,
    status: "published",
    coverImage: "",
    finishedImage: "",
    tags: [{ name: "Animals", slug: "animals" }, { name: "Cute", slug: "cute" }],
    categories: [{ name: "Animals", slug: "animals" }],
    collections: [{ name: "Summer Collection", slug: "summer-collection" }],
    steps: [
      { id: "s1", stepNumber: 1, description: "Prepare beads", gridData: "[[0,1]]" },
      { id: "s2", stepNumber: 2, description: "Place outline", gridData: "[[1,0]]" },
    ],
    seoTitle: "Cute Frog Perler Bead Pattern",
    seoDescription: "Download this cute frog bead pattern for free.",
    keywords: ["frog", "cute", "perler"],
    views: 1234,
    downloads: 567,
    likes: 89,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2025-06-10T00:00:00Z",
    healthScore: 92,
    healthChecks: [
      { label: "Cover Image", pass: true },
      { label: "Finished Image", pass: true },
      { label: "8 Steps", pass: false },
      { label: "SEO Title", pass: true },
      { label: "SEO Description", pass: true },
      { label: "3 Tags", pass: true },
      { label: "Collection", pass: true },
      { label: "Internal Links", pass: true },
      { label: "FAQ", pass: false },
    ],
  },
  {
    id: "p2",
    slug: "ghost-pattern",
    title: "Halloween Ghost",
    emoji: "👻",
    description: "Spooky ghost for Halloween.",
    difficulty: "Easy",
    grid: "16x16",
    beadCount: 198,
    colors: 5,
    status: "published",
    tags: [{ name: "Halloween", slug: "halloween" }],
    categories: [{ name: "Holiday", slug: "holiday" }],
    collections: [],
    steps: [],
    seoTitle: "Halloween Ghost Perler Bead Pattern",
    seoDescription: "Free Halloween ghost bead pattern.",
    keywords: ["ghost", "halloween"],
    views: 890,
    downloads: 340,
    likes: 45,
    createdAt: "2025-06-05T00:00:00Z",
    updatedAt: "2025-06-08T00:00:00Z",
    healthScore: 68,
    healthChecks: [
      { label: "Cover Image", pass: true },
      { label: "Finished Image", pass: false },
      { label: "8 Steps", pass: false },
      { label: "SEO Title", pass: true },
      { label: "SEO Description", pass: false },
      { label: "3 Tags", pass: false },
      { label: "Collection", pass: false },
      { label: "Internal Links", pass: true },
      { label: "FAQ", pass: false },
    ],
  },
];

const mockCollections: AdminCollection[] = [
  { id: "c1", slug: "summer-collection", title: "Summer Collection", description: "Summer vibes", displayOrder: 1, published: true, patternCount: 4, patterns: [{ id: "p1", title: "Cute Frog", slug: "cute-frog" }] },
  { id: "c2", slug: "halloween", title: "Halloween", description: "Spooky season", displayOrder: 2, published: true, patternCount: 2, patterns: [] },
  { id: "c3", slug: "pokemon-week", title: "Pokemon Week", description: "Pokemon inspired", displayOrder: 3, published: false, patternCount: 0, patterns: [] },
];

const mockCategories: AdminCategory[] = [
  { id: "cat1", slug: "animals", name: "Animals", icon: "pets", count: 4 },
  { id: "cat2", slug: "food", name: "Food", icon: "restaurant", count: 2 },
  { id: "cat3", slug: "holiday", name: "Holiday", icon: "event", count: 1 },
  { id: "cat4", slug: "characters", name: "Characters", icon: "person", count: 0 },
];

const mockTags: AdminTag[] = [
  { id: "t1", slug: "frog", name: "frog", popularity: 95, patternCount: 12 },
  { id: "t2", slug: "ghost", name: "ghost", popularity: 88, patternCount: 8 },
  { id: "t3", slug: "cute", name: "cute", popularity: 76, patternCount: 23 },
  { id: "t4", slug: "halloween", name: "halloween", popularity: 60, patternCount: 5 },
];

const mockMedia: AdminMedia[] = [
  { id: "m1", url: "https://example.com/frog.jpg", thumbnail: "https://example.com/frog.jpg", name: "frog.jpg", folder: "Pattern Covers", size: 120000, width: 512, height: 512, usedBy: [{ type: "pattern", title: "Cute Frog", slug: "cute-frog" }], createdAt: "2025-06-01T00:00:00Z" },
  { id: "m2", url: "https://example.com/ghost.jpg", thumbnail: "https://example.com/ghost.jpg", name: "ghost.jpg", folder: "Finished", size: 98000, width: 512, height: 512, usedBy: [], createdAt: "2025-06-05T00:00:00Z" },
];

const mockJobs: AdminBulkJob[] = [
  { id: "b1", name: "Initial CSV Import", status: "completed", total: 24, processed: 24, errors: 0, warnings: 2, createdAt: "2025-06-01T00:00:00Z", completedAt: "2025-06-01T00:05:00Z" },
  { id: "b2", name: "Halloween Batch", status: "running", total: 10, processed: 4, errors: 0, warnings: 0, createdAt: "2025-06-10T00:00:00Z" },
];

const mockRedirects: AdminRedirect[] = [
  { id: "r1", oldUrl: "/old-pattern", newUrl: "/pattern/new-pattern", type: 301 },
];

const mockMetadata: AdminMetadataTemplate[] = [
  { type: "pattern", titleTemplate: "{title} Perler Bead Pattern", descriptionTemplate: "Download {title} perler bead pattern for free. {difficulty} level, {beadCount} beads." },
  { type: "collection", titleTemplate: "{title} Perler Bead Patterns", descriptionTemplate: "Browse {title} perler bead patterns collection." },
  { type: "tag", titleTemplate: "{title} Perler Bead Patterns", descriptionTemplate: "Free {title} perler bead patterns to download and print." },
  { type: "home", titleTemplate: "BeadPatternAI | Discover Printable Perler Bead Patterns", descriptionTemplate: "Search thousands of free printable perler bead patterns or create your own with AI." },
];

const mockSubscribers: AdminSubscriber[] = [
  { id: "sub1", email: "alice@example.com", source: "homepage", createdAt: "2025-06-01T00:00:00Z" },
  { id: "sub2", email: "bob@example.com", source: "footer", createdAt: "2025-06-02T00:00:00Z" },
];

const mockSettings: Record<string, string> = {
  siteName: "BeadPatternAI",
  domain: "beadpatternai.com",
  defaultOG: "https://beadpatternai.com/og.jpg",
  googleVerification: "",
  bingVerification: "",
  rss: "true",
  twitter: "",
  instagram: "",
  facebook: "",
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ADMIN_API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json();
}

async function mockRequest<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY));
}

export const adminService = {
  isMock: process.env.NEXT_PUBLIC_ADMIN_MOCK !== "false",

  // Dashboard
  getDashboardStats(): Promise<AdminDashboardStats> {
    const stats: AdminDashboardStats = {
      patterns: { published: 12, draft: 4, archived: 1, total: 17 },
      collections: mockCollections.length,
      tags: mockTags.length,
      media: mockMedia.length,
      bulkJobs: mockJobs.length,
      latestPatterns: mockPatterns.slice(0, 5),
      latestJobs: mockJobs.slice(0, 5),
      topDownloaded: mockPatterns.map((p) => ({ title: p.title, slug: p.slug, downloads: p.downloads })).slice(0, 5),
      recentlyUpdated: mockPatterns.slice(0, 5),
      searchTrends: [{ term: "frog", count: 120 }, { term: "ghost", count: 98 }, { term: "pokemon", count: 76 }, { term: "flower", count: 54 }],
      googleIndex: { indexed: 45, submitted: 60, pending: 15 },
    };
    return this.isMock ? mockRequest(stats) : request("/dashboard");
  },

  // Patterns
  listPatterns(params?: { status?: string; difficulty?: string; collection?: string; category?: string; tag?: string; q?: string; page?: number; limit?: number }) {
    let data = [...mockPatterns];
    if (params?.status) data = data.filter((p) => p.status === params.status);
    if (params?.difficulty) data = data.filter((p) => p.difficulty === params.difficulty);
    if (params?.collection) data = data.filter((p) => p.collections.some((c) => c.slug === params.collection));
    if (params?.category) data = data.filter((p) => p.categories.some((c) => c.slug === params.category));
    if (params?.tag) data = data.filter((p) => p.tags.some((t) => t.slug === params.tag));
    if (params?.q) data = data.filter((p) => p.title.toLowerCase().includes(params.q!.toLowerCase()));
    return this.isMock ? mockRequest({ data, meta: { page: 1, limit: 20, total: data.length, totalPages: 1 } }) : request("/patterns", { method: "GET" });
  },
  getPattern(id: string): Promise<AdminPattern> {
    const p = mockPatterns.find((x) => x.id === id) || mockPatterns[0];
    return this.isMock ? mockRequest(p) : request(`/patterns/${id}`);
  },
  createPattern(data: Partial<AdminPattern>): Promise<AdminPattern> {
    return this.isMock ? mockRequest({ ...mockPatterns[0], ...data, id: `p${Date.now()}` }) : request("/patterns", { method: "POST", body: JSON.stringify(data) });
  },
  updatePattern(id: string, data: Partial<AdminPattern>): Promise<AdminPattern> {
    return this.isMock ? mockRequest({ ...mockPatterns[0], ...data, id }) : request(`/patterns/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deletePattern(id: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/patterns/${id}`, { method: "DELETE" });
  },
  bulkPublish(ids: string[]): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request("/patterns/bulk-publish", { method: "POST", body: JSON.stringify({ ids }) });
  },
  bulkArchive(ids: string[]): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request("/patterns/bulk-archive", { method: "POST", body: JSON.stringify({ ids }) });
  },
  bulkDelete(ids: string[]): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request("/patterns/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) });
  },

  // Collections
  listCollections(): Promise<AdminCollection[]> {
    return this.isMock ? mockRequest(mockCollections) : request("/collections");
  },
  getCollection(id: string): Promise<AdminCollection> {
    return this.isMock ? mockRequest(mockCollections.find((c) => c.id === id) || mockCollections[0]) : request(`/collections/${id}`);
  },
  createCollection(data: Partial<AdminCollection>): Promise<AdminCollection> {
    return this.isMock ? mockRequest({ ...mockCollections[0], ...data, id: `c${Date.now()}` }) : request("/collections", { method: "POST", body: JSON.stringify(data) });
  },
  updateCollection(id: string, data: Partial<AdminCollection>): Promise<AdminCollection> {
    return this.isMock ? mockRequest({ ...mockCollections[0], ...data, id }) : request(`/collections/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteCollection(id: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/collections/${id}`, { method: "DELETE" });
  },

  // Categories
  listCategories(): Promise<AdminCategory[]> {
    return this.isMock ? mockRequest(mockCategories) : request("/categories");
  },
  createCategory(data: Partial<AdminCategory>): Promise<AdminCategory> {
    return this.isMock ? mockRequest({ ...mockCategories[0], ...data, id: `cat${Date.now()}` }) : request("/categories", { method: "POST", body: JSON.stringify(data) });
  },
  updateCategory(id: string, data: Partial<AdminCategory>): Promise<AdminCategory> {
    return this.isMock ? mockRequest({ ...mockCategories[0], ...data, id }) : request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteCategory(id: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/categories/${id}`, { method: "DELETE" });
  },

  // Tags
  listTags(): Promise<AdminTag[]> {
    return this.isMock ? mockRequest(mockTags) : request("/tags");
  },
  createTag(data: Partial<AdminTag>): Promise<AdminTag> {
    return this.isMock ? mockRequest({ ...mockTags[0], ...data, id: `t${Date.now()}` }) : request("/tags", { method: "POST", body: JSON.stringify(data) });
  },
  updateTag(id: string, data: Partial<AdminTag>): Promise<AdminTag> {
    return this.isMock ? mockRequest({ ...mockTags[0], ...data, id }) : request(`/tags/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteTag(id: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/tags/${id}`, { method: "DELETE" });
  },
  mergeTags(sourceId: string, targetId: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request("/tags/merge", { method: "POST", body: JSON.stringify({ sourceId, targetId }) });
  },

  // Media
  listMedia(folder?: string): Promise<AdminMedia[]> {
    let data = [...mockMedia];
    if (folder) data = data.filter((m) => m.folder === folder);
    return this.isMock ? mockRequest(data) : request(`/media${folder ? `?folder=${folder}` : ""}`);
  },
  deleteMedia(id: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/media/${id}`, { method: "DELETE" });
  },

  // Bulk Import
  listBulkJobs(): Promise<AdminBulkJob[]> {
    return this.isMock ? mockRequest(mockJobs) : request("/bulk-jobs");
  },
  uploadBulkCSV(file: File): Promise<AdminBulkJob> {
    return this.isMock ? mockRequest({ ...mockJobs[0], id: `b${Date.now()}`, name: file.name, status: "pending" as const }) : request("/bulk-jobs", { method: "POST", body: file });
  },
  runBulkJob(id: string, publishNow: boolean): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/bulk-jobs/${id}/run`, { method: "POST", body: JSON.stringify({ publishNow }) });
  },

  // SEO
  listRedirects(): Promise<AdminRedirect[]> {
    return this.isMock ? mockRequest(mockRedirects) : request("/redirects");
  },
  createRedirect(data: Partial<AdminRedirect>): Promise<AdminRedirect> {
    return this.isMock ? mockRequest({ ...mockRedirects[0], ...data, id: `r${Date.now()}` }) : request("/redirects", { method: "POST", body: JSON.stringify(data) });
  },
  deleteRedirect(id: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/redirects/${id}`, { method: "DELETE" });
  },
  listMetadata(): Promise<AdminMetadataTemplate[]> {
    return this.isMock ? mockRequest(mockMetadata) : request("/metadata");
  },
  updateMetadata(data: AdminMetadataTemplate[]): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request("/metadata", { method: "PUT", body: JSON.stringify(data) });
  },
  regenerateSitemap(): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request("/sitemap/regenerate", { method: "POST" });
  },

  // Analytics
  getPatternStats(id: string, days: 7 | 30 | 90): Promise<{ views: number[]; downloads: number[]; likes: number[]; labels: string[] }> {
    return this.isMock ? mockRequest({ views: [10, 20, 30], downloads: [5, 8, 12], likes: [1, 2, 3], labels: ["Day 1", "Day 2", "Day 3"] }) : request(`/analytics/patterns/${id}?days=${days}`);
  },

  // Newsletter
  listSubscribers(): Promise<AdminSubscriber[]> {
    return this.isMock ? mockRequest(mockSubscribers) : request("/subscribers");
  },
  exportSubscribers(): Promise<Blob> {
    return this.isMock ? mockRequest(new Blob(["email,source,created_at\nalice@example.com,homepage,2025-06-01"])) : request("/subscribers/export");
  },
  deleteSubscriber(id: string): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request(`/subscribers/${id}`, { method: "DELETE" });
  },

  // Settings
  listSettings(): Promise<AdminSetting[]> {
    return this.isMock ? mockRequest(Object.entries(mockSettings).map(([key, value]) => ({ key, value }))) : request("/settings");
  },
  updateSettings(settings: Record<string, string>): Promise<void> {
    return this.isMock ? mockRequest(undefined) : request("/settings", { method: "PUT", body: JSON.stringify(settings) });
  },
};
