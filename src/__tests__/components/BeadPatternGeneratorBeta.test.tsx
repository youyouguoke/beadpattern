import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BeadPatternGeneratorBeta from "../../components/generate/BeadPatternGeneratorBeta";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("BeadPatternGeneratorBeta", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders input and quick action buttons", () => {
    render(<BeadPatternGeneratorBeta />);

    expect(screen.getByPlaceholderText(/e\.g\., cute frog drinking bubble tea/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /32x32/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pastel Dream/i })).toBeInTheDocument();
  });

  it("searches existing patterns when prompt is submitted", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          patterns: [
            { id: "p1", slug: "cute-frog", title: "Cute Frog", difficulty: "easy", grid_size: "24x24", color_count: 3, estimated_beads: 576, created_at: "", updated_at: "" },
          ],
          query: "frog",
          total: 1,
        },
      }),
      text: async () => "{}",
    } as Response);

    render(<BeadPatternGeneratorBeta />);

    const input = screen.getByPlaceholderText(/e\.g\., cute frog drinking bubble tea/i) as HTMLTextAreaElement;
    await userEvent.clear(input);
    await userEvent.type(input, "frog");

    await userEvent.click(screen.getByRole("button", { name: /Search & Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/Found 1 matching/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Cute Frog")).toBeInTheDocument();
  });

  it("shows fallback AI preview when no patterns match", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { patterns: [], query: "unknown-xyz", total: 0 },
      }),
      text: async () => "{}",
    } as Response);

    render(<BeadPatternGeneratorBeta />);

    const input = screen.getByPlaceholderText(/e\.g\., cute frog drinking bubble tea/i) as HTMLTextAreaElement;
    await userEvent.clear(input);
    await userEvent.type(input, "unknown-xyz");

    await userEvent.click(screen.getByRole("button", { name: /Search & Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/local AI preview/i)).toBeInTheDocument();
    });
  });
});
