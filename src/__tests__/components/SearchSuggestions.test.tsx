import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchSuggestions from "../../components/archive/SearchSuggestions";

const STORAGE_KEY = "bpai_search_history";

describe("SearchSuggestions", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not render when query is empty", () => {
    render(<SearchSuggestions query="" onSelect={() => {}} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders suggestions when query matches", () => {
    render(<SearchSuggestions query="cat" onSelect={() => {}} />);
    expect(screen.getByText("cat perler bead pattern")).toBeInTheDocument();
  });

  it("calls onSelect when a suggestion is clicked", async () => {
    const onSelect = jest.fn();
    render(<SearchSuggestions query="cat" onSelect={onSelect} />);

    const item = screen.getByText("cat perler bead pattern");
    await userEvent.click(item);

    expect(onSelect).toHaveBeenCalledWith("cat perler bead pattern");
  });
});
