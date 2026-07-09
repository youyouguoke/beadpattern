import { render, screen, waitFor } from "@testing-library/react";
import PatternArchive from "../../components/archive/PatternArchive";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function makeBackendPattern(i: number, overrides: Partial<any> = {}) {
  return {
    id: `p${i}`,
    slug: `pattern-${i}`,
    title: `Pattern ${i}`,
    difficulty: "easy",
    grid_size: "24x24",
    color_count: 4,
    estimated_beads: 576,
    views: i * 10,
    downloads: i * 5,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tags: [],
    ...overrides,
  };
}

function mockPatternsResponse(items: any[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { items, meta: { page: 1, limit: 20, total: items.length, totalPages: 1 } } }),
    text: async () => "{}",
  } as Response;
}

describe("PatternArchive", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders the search query heading", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockPatternsResponse([makeBackendPattern(0)]));

    render(<PatternArchive searchQuery="frog" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Search Results for "frog"/i })).toBeInTheDocument();
    });
  });

  it("fetches and displays patterns", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockPatternsResponse([
      makeBackendPattern(0),
      makeBackendPattern(1),
    ]));

    render(<PatternArchive />);

    await waitFor(() => {
      expect(screen.getByText("Pattern 0")).toBeInTheDocument();
      expect(screen.getByText("Pattern 1")).toBeInTheDocument();
    });
  });

  it("filters by category when categorySlug is provided", async () => {
    // The API is expected to filter server-side when categorySlug is passed.
    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("category=animals")) {
        return mockPatternsResponse([makeBackendPattern(1, { tags: [{ name: "Animals", slug: "animals" }] })]);
      }
      return mockPatternsResponse([
        makeBackendPattern(1, { tags: [{ name: "Animals", slug: "animals" }] }),
        makeBackendPattern(2, { tags: [{ name: "Food", slug: "food" }] }),
      ]);
    });

    render(<PatternArchive categorySlug="animals" />);

    await waitFor(() => {
      expect(screen.getByText("Pattern 1")).toBeInTheDocument();
    });
    expect(screen.queryByText("Pattern 2")).not.toBeInTheDocument();
  });
});
