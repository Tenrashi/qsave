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
    renderWithProviders(<SyncHistory />);
    await screen.findByText("The Sims 4");
    expect(screen.getAllByRole("img", { name: "history.successIcon" })).toHaveLength(1);
  });

  it("shows error icon for failed syncs", async () => {
    renderWithProviders(<SyncHistory />);
    await screen.findByText("Cyberpunk 2077");
    expect(screen.getAllByRole("img", { name: "history.errorIcon" })).toHaveLength(1);
  });
});
