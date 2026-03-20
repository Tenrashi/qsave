import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { EmptyBackups } from "./EmptyBackups";

describe("EmptyBackups", () => {
  it("renders no backups message", () => {
    renderWithProviders(<EmptyBackups />);
    expect(screen.getByText("restore.noBackups")).toBeInTheDocument();
  });
});
