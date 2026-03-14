import { create } from "zustand";
import type { SyncStatus } from "@/domain/types";

type SyncStore = {
  fileStatuses: Record<string, SyncStatus>;
  setStatus: (path: string, status: SyncStatus) => void;
  setBulkStatus: (paths: string[], status: SyncStatus) => void;
};

export const useSyncStore = create<SyncStore>((set) => ({
  fileStatuses: {},

  setStatus: (path, status) =>
    set((state) => ({ fileStatuses: { ...state.fileStatuses, [path]: status } })),

  setBulkStatus: (paths, status) =>
    set((state) => ({
      fileStatuses: {
        ...state.fileStatuses,
        ...Object.fromEntries(paths.map((p) => [p, status])),
      },
    })),
}));
