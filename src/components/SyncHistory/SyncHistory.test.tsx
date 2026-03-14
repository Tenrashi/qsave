import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { SyncHistory } from "./SyncHistory";

vi.mock("@/lib/store", () => ({
  getSyncHistory: vi.fn(() =>
    Promise.resolve([
      {
        id: "1",
        gameName: "The Sims 4",
        fileName: "Slot_001.save",
        syncedAt: new Date(),
        driveFileId: "abc",
        revisionCount: 3,
        status: "success",
      },
      {
        id: "2",
        gameName: "Cyberpunk 2077",
        fileName: "manual.save",
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
  it("renders sync records", async () => {
    renderWithProviders(<SyncHistory />);
    expect(await screen.findByText("The Sims 4/Slot_001.save")).toBeInTheDocument();
    expect(screen.getByText("Cyberpunk 2077/manual.save")).toBeInTheDocument();
  });

  it("shows revision badge for multi-revision files", async () => {
    renderWithProviders(<SyncHistory />);
    expect(await screen.findByText("v3")).toBeInTheDocument();
  });
});
