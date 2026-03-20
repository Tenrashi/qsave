import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { BackupsSkeleton } from "./BackupsSkeleton";

describe("BackupsSkeleton", () => {
  it("renders skeleton rows", () => {
    renderWithProviders(<BackupsSkeleton />);
    expect(screen.queryByText("restore.noBackups")).not.toBeInTheDocument();
  });
});
