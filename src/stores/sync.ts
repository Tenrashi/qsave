import { create } from "zustand";
import type { SyncStatus, GameSyncFingerprint } from "@/domain/types";
import {
  getWatchedGames,
  setWatchedGames,
  getSyncFingerprints,
  setSyncFingerprint,
} from "@/lib/store";

type SyncStore = {
  gameStatuses: Record<string, SyncStatus>;
  setGameStatus: (gameName: string, status: SyncStatus) => void;

  watchedGames: Record<string, boolean>;
  initWatchPreferences: () => Promise<void>;
  toggleGameWatch: (gameName: string) => Promise<void>;
  isGameWatched: (gameName: string) => boolean;

  syncFingerprints: Record<string, GameSyncFingerprint>;
  initSyncFingerprints: () => Promise<void>;
  updateSyncFingerprint: (gameName: string, hash: string) => Promise<void>;
};

export const useSyncStore = create<SyncStore>((set, get) => ({
  gameStatuses: {},
  watchedGames: {},
  syncFingerprints: {},

  setGameStatus: (gameName, status) =>
    set((state) => ({ gameStatuses: { ...state.gameStatuses, [gameName]: status } })),

  initWatchPreferences: async () => {
    const names = await getWatchedGames();
    const map: Record<string, boolean> = {};
    for (const name of names) {
      map[name] = true;
    }
    set({ watchedGames: map });
  },

  toggleGameWatch: async (gameName) => {
    const current = get().watchedGames[gameName] ?? false;
    const updated = { ...get().watchedGames, [gameName]: !current };
    set({ watchedGames: updated });
    const names = Object.entries(updated)
      .filter(([, v]) => v)
      .map(([k]) => k);
    await setWatchedGames(names);
  },

  isGameWatched: (gameName) => get().watchedGames[gameName] ?? false,

  initSyncFingerprints: async () => {
    const fingerprints = await getSyncFingerprints();
    set({ syncFingerprints: fingerprints });
  },

  updateSyncFingerprint: async (gameName, hash) => {
    const fingerprint: GameSyncFingerprint = {
      hash,
      syncedAt: new Date().toISOString(),
    };
    set((state) => ({
      syncFingerprints: { ...state.syncFingerprints, [gameName]: fingerprint },
    }));
    await setSyncFingerprint(gameName, fingerprint);
  },
}));
