import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PatternDetail from "../../components/pattern/PatternDetail";
import { Pattern } from "../../lib/patternService";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockPattern: Pattern = {
  slug: "cute-frog",
  title: "Cute Frog",
  emoji: "🐸",
  img: "",
  finished: "",
  difficulty: "Easy",
  grid: "32x32",
  colors: 5,
  beadCount: 1024,
  downloads: "1.2k",
  palette: [],
  steps: [],
  related: [],
  description: "A cute frog drinking bubble tea.",
  gridData: [[0, 1]],
  colorPalette: ["#ff6b6b", "#4ecdc4"],
};

function mockResponse(r: { ok: boolean; status: number; json: unknown }) {
  return {
    ok: r.ok,
    status: r.status,
    json: async () => r.json,
    text: async () => JSON.stringify(r.json),
  } as Response;
}

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
}));

describe("PatternDetail", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ ok: true, status: 200, json: { success: true, data: [] } }));
  });

  it("renders pattern title and actions after loading", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse({
        ok: true,
        status: 200,
        json: {
          success: true,
          data: {
            pattern: { id: "p1", slug: "cute-frog", title: "Cute Frog", difficulty: "easy", grid_size: "32x32", estimated_beads: 1024, color_count: 5, color_palette: ["#ff6b6b"], grid_data: [[0]], status: "published" },
            steps: [],
            tags: [{ name: "Animals", slug: "animals" }],
            analytics: { views: 100, likes: 10, downloads: 20, updated_at: "" },
          },
        },
      }));

    render(<PatternDetail slug="cute-frog" />);

    await waitFor(() => {
      expect(screen.getAllByText("Cute Frog").length).toBeGreaterThan(0);
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });

  it("toggles save button text when clicked", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse({
        ok: true,
        status: 200,
        json: {
          success: true,
          data: {
            pattern: { id: "p1", slug: "cute-frog", title: "Cute Frog", difficulty: "easy", grid_size: "32x32", estimated_beads: 1024, color_count: 5, color_palette: ["#ff6b6b"], grid_data: [[0]], status: "published" },
            steps: [],
            tags: [],
            analytics: { views: 0, likes: 0, downloads: 0, updated_at: "" },
          },
        },
      }));

    render(<PatternDetail slug="cute-frog" />);

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Saved"));
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });
});
