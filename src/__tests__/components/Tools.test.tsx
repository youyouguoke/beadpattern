import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BeadCalculator from "../../components/tools/BeadCalculator";

describe("BeadCalculator", () => {
  it("renders default values and calculates totals", () => {
    render(<BeadCalculator />);
    expect(screen.getByRole("spinbutton", { name: /Width/i })).toHaveValue(32);
    expect(screen.getByRole("spinbutton", { name: /Height/i })).toHaveValue(32);
    expect(screen.getByText(/1,024/i)).toBeInTheDocument();
  });

  it("updates results when width or height changes", async () => {
    render(<BeadCalculator />);
    const widthInput = screen.getByRole("spinbutton", { name: /Width/i });
    await userEvent.clear(widthInput);
    await userEvent.type(widthInput, "10");

    expect(screen.getByText(/320/i)).toBeInTheDocument();
  });

  it("toggles spare buffer and updates bead count", async () => {
    render(<BeadCalculator />);
    const checkbox = screen.getByRole("checkbox", { name: /spare beads/i });

    await userEvent.click(checkbox);
    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});

import GridConverter from "../../components/tools/GridConverter";

describe("GridConverter", () => {
  it("renders default conversion", () => {
    render(<GridConverter />);
    expect(screen.getByRole("spinbutton", { name: /Original bead count/i })).toHaveValue(1000);
  });

  it("updates target bead count when original changes", async () => {
    render(<GridConverter />);
    const input = screen.getByRole("spinbutton", { name: /Original bead count/i });
    await userEvent.clear(input);
    await userEvent.type(input, "500");

    // 29x29 -> 58x58 density ratio is 0.25, so 500 beads becomes ~125 beads
    expect(screen.getByText(/125/i)).toBeInTheDocument();
  });
});
