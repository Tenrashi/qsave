import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { ReactNode } from "react";
import { RECORD_STATUS, SYNC_STATUS } from "@/domain/types";
import type { SyncRecord } from "@/domain/types";
import { useSyncStore } from "@/stores/sync";
import { sims4Game } from "@/test/mocks/games";
import { mockBackups } from "@/test/mocks/drive";
import { useRestoreBackup } from "./useRestoreBackup";

i18n.use(initReactI18next).init({
  lng: "cimode",
  resources: {},
  interpolation: { escapeValue: false },
  showSupportNotice: false,
});

const defaultRecord: SyncRecord = {
  id: "r1",
  gameName: "The Sims 4",
  fileName: "The Sims 4.zip",
  syncedAt: new Date(),
  driveFileId: "b1",
  revisionCount: 3,
  status: RECORD_STATUS.success,
  type: "restore",
};

const { mockListGameBackups, mockRestoreGame } = vi.hoisted(() => ({
  mockListGameBackups: vi.fn(),
  mockRestoreGame: vi.fn(),
}));

vi.mock("@/services/drive/drive", () => ({
  listGameBackups: mockListGameBackups,
}));

vi.mock("@/services/restore/restore", () => ({
  restoreGame: mockRestoreGame,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
};

describe("useRestoreBackup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRestoreGame.mockResolvedValue(defaultRecord);
    mockListGameBackups.mockResolvedValue(mockBackups);
    useSyncStore.setState({ gameStatuses: {}, syncFingerprints: {} });
  });

  it("restores a backup by id", async () => {
    const { result } = renderHook(() => useRestoreBackup(sims4Game), {
      wrapper: createWrapper(),
    });

    await act(() => result.current.mutateAsync("b1"));

    expect(mockRestoreGame).toHaveBeenCalledWith(sims4Game, "b1");
  });

  it("resolves latest backup when no id is provided", async () => {
    const { result } = renderHook(() => useRestoreBackup(sims4Game), {
      wrapper: createWrapper(),
    });

    await act(() => result.current.mutateAsync(undefined));

    expect(mockListGameBackups).toHaveBeenCalledWith("The Sims 4");
    expect(mockRestoreGame).toHaveBeenCalledWith(sims4Game, "b1");
  });

  it("sets game status to success after restore", async () => {
    const { result } = renderHook(() => useRestoreBackup(sims4Game), {
      wrapper: createWrapper(),
    });

    await act(() => result.current.mutateAsync("b1"));

    await waitFor(() => {
      expect(useSyncStore.getState().gameStatuses["The Sims 4"]).toBe(
        SYNC_STATUS.success,
      );
    });
  });

  it("sets game status to error when restore fails", async () => {
    mockRestoreGame.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRestoreBackup(sims4Game), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync("b1");
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(useSyncStore.getState().gameStatuses["The Sims 4"]).toBe(
        SYNC_STATUS.error,
      );
    });
  });
});
