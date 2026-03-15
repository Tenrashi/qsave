import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { SyncHistory } from "./SyncHistory";

vi.mock("@/lib/store", () => ({
  getSyncHistory: vi.fn(() =>
    Promise.resolve([
      {
        id: "1",
        gameName: "The Sims 4",
        fileName: "The Sims 4.zip",
        syncedAt: new Date(),
        driveFileId: "abc",
        revisionCount: 1,
        status: "success",
      },
      {
        id: "2",
        gameName: "Cyberpunk 2077",
        fileName: "Cyberpunk 2077.zip",
        syncedAt: new Date(),
        driveFileId: "",
        revisionCount: 0,
        status: "error",
        error: "Network error",
      },
    ]),
  ),
}));

describe("SyncHistory", () => {
  it("renders game names", async () => {
    renderWithProviders(<SyncHistory />);
    expect(await screen.findByText("The Sims 4")).toBeInTheDocument();
    expect(screen.getByText("Cyberpunk 2077")).toBeInTheDocument();
  });

  it("shows success icon for successful syncs", async () => {
    const { container } = renderWithProviders(<SyncHistory />);
    await screen.findByText("The Sims 4");
    const successIcons = container.querySelectorAll(".text-green-500");
    expect(successIcons.length).toBe(1);
  });

  it("shows error icon for failed syncs", async () => {
    const { container } = renderWithProviders(<SyncHistory />);
    await screen.findByText("Cyberpunk 2077");
    const errorIcons = container.querySelectorAll(".text-destructive");
    expect(errorIcons.length).toBe(1);
  });
});
