import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { StatusMessage } from "./status-message";

describe("StatusMessage", () => {
  it("renders pending variant with message", () => {
    renderWithProviders(
      <StatusMessage variant="pending" message="Loading..." />,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders success variant with message", () => {
    renderWithProviders(<StatusMessage variant="success" message="Done!" />);
    expect(screen.getByText("Done!")).toBeInTheDocument();
  });

  it("renders error variant with message", () => {
    renderWithProviders(<StatusMessage variant="error" message="Failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
