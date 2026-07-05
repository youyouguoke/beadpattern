import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BeadPatternGenerator from "../../components/generate/BeadPatternGenerator";

const mockCreatePattern = jest.fn();
const mockGetPattern = jest.fn();
const mockGetAllPatterns = jest.fn();

jest.mock("../../lib/patternService", () => ({
  createPattern: (...args: any[]) => mockCreatePattern(...args),
  getPattern: (...args: any[]) => mockGetPattern(...args),
  getAllPatterns: (...args: any[]) => mockGetAllPatterns(...args),
  API_BASE: "https://bead-pattern-ai.youyouguoke.workers.dev",
}));

describe("BeadPatternGenerator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllPatterns.mockResolvedValue([]);
  });

  it("renders the generator form", () => {
    render(<BeadPatternGenerator />);
    expect(screen.getByText("Design Your Vision")).toBeInTheDocument();
    expect(screen.getByText("Generate Pattern")).toBeInTheDocument();
  });

  it("shows loading state after clicking generate", async () => {
    let resolveCreate: (value: any) => void;
    const createDeferred = new Promise<any>((resolve) => { resolveCreate = resolve; });
    mockCreatePattern.mockReturnValue(createDeferred);

    render(<BeadPatternGenerator />);
    const button = screen.getByText("Generate Pattern");
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText("Drafting your pattern...").length).toBeGreaterThan(0);
    });

    resolveCreate!({ slug: "cute-frog" });
    await waitFor(() => {
      expect(screen.getByText("Generate Pattern")).toBeInTheDocument();
    });
  });

  it("displays the generated pattern and action buttons", async () => {
    mockCreatePattern.mockResolvedValue({ slug: "cute-frog" });
    mockGetPattern.mockResolvedValue({
      slug: "cute-frog",
      title: "cute frog drinking bubble tea",
      grid: "32x32",
      colorPalette: ["#ff6b6b"],
      gridData: [[0]],
    });

    render(<BeadPatternGenerator />);
    const button = screen.getByText("Generate Pattern");
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("View Pattern")).toBeInTheDocument();
      expect(screen.getByText("Color Chart")).toBeInTheDocument();
      expect(screen.getByText("Share")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows error message when pattern creation fails", async () => {
    mockCreatePattern.mockRejectedValue(new Error("server error"));

    render(<BeadPatternGenerator />);
    const button = screen.getByText("Generate Pattern");
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Generation failed")).toBeInTheDocument();
    });
  });
});
