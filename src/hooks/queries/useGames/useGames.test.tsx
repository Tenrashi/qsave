import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@/test/test-utils";
import { useGames } from "./useGames";

const { mockScanForGames, mockToastError } = vi.hoisted(() => ({
  mockScanForGames: vi.fn(() =>
    Promise.resolve([
      { name: "Elden Ring", savePaths: ["/saves/elden"], saveFiles: [] },
    ]),
  ),
  mockToastError: vi.fn(),
}));

vi.mock("@/operations/scanner/scanner/scanner", () => ({
  scanForGames: mockScanForGames,
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError },
}));

describe("useGames", () => {
  it("returns games from scanner", async () => {
    const { result } = renderHook(() => useGames());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("Elden Ring");
  });

  it("shows error toast when scan fails", async () => {
    mockScanForGames.mockRejectedValue(new Error("scan failed"));

    renderHook(() => useGames());

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("toast.scanFailed", {
        description: "scan failed",
      }),
    );
  });
});
