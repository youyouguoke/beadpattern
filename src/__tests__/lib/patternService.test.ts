import {
  getAllPatterns,
  getPattern,
  getTrendingPatterns,
  getCollections,
  getCategories,
  getCategoryBySlug,
  getRelatedPatterns,
  createPattern,
  searchPatterns,
  API_BASE,
  type Pattern,
  type BackendPattern,
  type BackendTag,
} from "../../lib/patternService";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const basePattern: BackendPattern = {
  id: "p1",
  slug: "cute-frog",
  title: "Cute Frog",
  difficulty: "easy",
  status: "published",
  grid_size: "32x32",
  estimated_beads: 1024,
  color_count: 5,
  views: 100,
  likes: 10,
  downloads: 20,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  color_palette: ["#ff6b6b", "#4ecdc4"],
  grid_data: [[0, 1]] as unknown as string[][],
  cover_image: null,
};

function mockFetch(response: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  } as Response);
}

function mockFetchSequence(responses: { ok: boolean; status: number; json: unknown }[]) {
  for (const r of responses) {
    mockFetch(r.json, r.ok, r.status);
  }
}

function mockFetchError() {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network error"));
}

describe("patternService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("getAllPatterns", () => {
    it("returns normalized patterns from backend", async () => {
      mockFetch({
        success: true,
        data: [basePattern],
      });

      const result = await getAllPatterns();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/patterns"),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("cute-frog");
      expect(result[0].title).toBe("Cute Frog");
    });

    it("falls back to mock data when backend fails", async () => {
      mockFetchError();
      const result = await getAllPatterns();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("slug");
      expect(result[0]).toHaveProperty("title");
    });
  });

  describe("getPattern", () => {
    it("returns a single pattern when backend returns data", async () => {
      mockFetch({
        success: true,
        data: {
          pattern: basePattern,
          steps: [],
          tags: [{ name: "Animals", slug: "animals" }],
          analytics: { views: 100, likes: 10, downloads: 20, updated_at: "" },
        },
      });

      const result = await getPattern("cute-frog");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/patterns/cute-frog"),
        expect.any(Object)
      );
      expect(result).not.toBeNull();
      expect(result?.slug).toBe("cute-frog");
      expect(result?.tags).toHaveLength(1);
    });
  });

  describe("getTrendingPatterns", () => {
    it("requests sort=popular and returns up to 8 patterns", async () => {
      mockFetch({
        success: true,
        data: {
          items: [basePattern, { ...basePattern, id: "p2", slug: "ghost" }],
          meta: { page: 1, limit: 8, total: 2, totalPages: 1 },
        },
      });

      const result = await getTrendingPatterns();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/patterns?sort=popular"),
        expect.any(Object)
      );
      expect(result.length).toBeLessThanOrEqual(8);
      expect(result[0]).toHaveProperty("slug");
    });
  });

  describe("getCollections", () => {
    it("returns collections from backend tags", async () => {
      const tags: BackendTag[] = [
        { id: "t1", name: "Halloween", slug: "halloween", type: "theme", count: 12 },
      ];
      mockFetch({ success: true, data: tags });

      const result = await getCollections();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tags"),
        expect.any(Object)
      );
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("slug");
    });
  });

  describe("getCategories", () => {
    it("returns categories from backend tags excluding difficulty", async () => {
      const tags: BackendTag[] = [
        { id: "t1", name: "Animals", slug: "animals", type: "animal", count: 30 },
        { id: "t2", name: "Easy", slug: "easy", type: "difficulty", count: 5 },
      ];
      mockFetch({ success: true, data: tags });

      const result = await getCategories();
      expect(result.some((c) => c.slug === "animals")).toBe(true);
      expect(result.some((c) => c.slug === "easy")).toBe(false);
    });
  });

  describe("getCategoryBySlug", () => {
    it("finds a category by slug", async () => {
      const tags: BackendTag[] = [
        { id: "t1", name: "Animals", slug: "animals", type: "animal", count: 30 },
      ];
      mockFetch({ success: true, data: tags });

      const result = await getCategoryBySlug("animals");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Animals");
    });

    it("falls back to mock categories when backend has no match", async () => {
      mockFetch({ success: true, data: [] });
      const result = await getCategoryBySlug("kawaii");
      expect(result).not.toBeNull();
      expect(result?.slug).toBe("kawaii");
    });
  });

  describe("getRelatedPatterns", () => {
    it("fetches related patterns from recommend endpoint", async () => {
      mockFetch({
        success: true,
        data: [basePattern],
      });

      const result = await getRelatedPatterns("cute-frog", 4);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/recommend?slug=cute-frog"),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("cute-frog");
    });
  });

  describe("createPattern", () => {
    it("creates a pattern and returns slug/id", async () => {
      mockFetch(
        {
          success: true,
          data: {
            pattern: { id: "p1", slug: "cute-frog" },
          },
        },
        true,
        201
      );

      const result = await createPattern({
        title: "Cute Frog",
        difficulty: "easy",
        grid_size: "32x32",
        grid_data: [[0, 1]],
        color_palette: [{ hex: "#ff6b6b" }],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/patterns"),
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual({ id: "p1", slug: "cute-frog" });
    });

    it("returns null on failure", async () => {
      mockFetch({ success: false }, false, 500);
      const result = await createPattern({ title: "x" });
      expect(result).toBeNull();
    });
  });

  describe("searchPatterns", () => {
    it("searches patterns via backend", async () => {
      mockFetch({
        success: true,
        data: {
          items: [basePattern],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      });

      const result = await searchPatterns("frog");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("q=frog"),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("API_BASE", () => {
    it("is defined and points to production backend", () => {
      expect(API_BASE).toBe(
        "https://bead-pattern-ai.youyouguoke.workers.dev"
      );
    });
  });
});
