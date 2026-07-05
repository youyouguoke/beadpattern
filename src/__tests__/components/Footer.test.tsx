import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Footer from "../../components/Footer";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("Footer newsletter", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
  });

  it("renders the newsletter form", () => {
    render(<Footer />);
    expect(screen.getByTestId("newsletter-email")).toBeInTheDocument();
    expect(screen.getByTestId("newsletter-submit")).toBeInTheDocument();
  });

  it("subscribes successfully and shows thanks message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { email: "user@example.com", status: "subscribed" } }),
    } as Response);

    render(<Footer />);
    const input = screen.getByTestId("newsletter-email") as HTMLInputElement;
    const submit = screen.getByTestId("newsletter-submit");

    await userEvent.type(input, "user@example.com");
    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId("newsletter-message")).toHaveTextContent("Thanks for subscribing!");
    });
    expect(input.value).toBe("");
  });

  it("shows already-subscribed message on duplicate email", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { email: "user@example.com", status: "already_subscribed" } }),
    } as Response);

    render(<Footer />);
    const input = screen.getByTestId("newsletter-email");
    const submit = screen.getByTestId("newsletter-submit");

    await userEvent.type(input, "user@example.com");
    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId("newsletter-message")).toHaveTextContent("You're already subscribed!");
    });
  });

  it("shows error message when subscription fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: { message: "Invalid email" } }),
    } as Response);

    render(<Footer />);
    const input = screen.getByTestId("newsletter-email");
    const submit = screen.getByTestId("newsletter-submit");

    await userEvent.type(input, "bad@example.com");
    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId("newsletter-message")).toHaveTextContent("Invalid email");
    });
  });

  it("shows network error message when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network down"));

    render(<Footer />);
    const input = screen.getByTestId("newsletter-email");
    const submit = screen.getByTestId("newsletter-submit");

    await userEvent.type(input, "user@example.com");
    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId("newsletter-message")).toHaveTextContent("Network error");
    });
  });

  it("does not submit when email is empty", async () => {
    render(<Footer />);
    const submit = screen.getByTestId("newsletter-submit");
    await userEvent.click(submit);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
