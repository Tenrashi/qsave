import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { QuickWarning } from "./QuickWarning";

describe("QuickWarning", () => {
  it("renders warning text", () => {
    renderWithProviders(<QuickWarning />);
    expect(screen.getByText("restore.warning")).toBeInTheDocument();
  });
});
