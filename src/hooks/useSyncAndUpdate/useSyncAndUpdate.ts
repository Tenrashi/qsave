import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Game } from "@/domain/types";
import { SYNC_STATUS } from "@/domain/types";
import { QUERY_KEYS } from "@/lib/constants/constants";
import { syncGame, type SyncResult } from "@/operations/sync/sync/sync";
import { useSyncStore } from "@/stores/sync";
import i18n from "@/i18n";

export const useSyncAndUpdate = (): ((game: Game) => Promise<SyncResult>) => {
  const queryClient = useQueryClient();

  return async (game: Game) => {
    const { setGameStatus, updateSyncFingerprint, markGameBackedUp } =
      useSyncStore.getState();
    setGameStatus(game.name, SYNC_STATUS.syncing);
    try {
      const result = await syncGame(game);
      const status =
        result.status === SYNC_STATUS.error
          ? SYNC_STATUS.error
          : SYNC_STATUS.success;
      setGameStatus(game.name, status);
      if (status === SYNC_STATUS.success) {
        markGameBackedUp(game.name);
        if (result.contentHash) {
          await updateSyncFingerprint(game.name, result.contentHash);
        }
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.syncHistory });
      const toastFn =
        status === SYNC_STATUS.success ? toast.success : toast.error;
      const toastKey =
        status === SYNC_STATUS.success
          ? "toast.syncSuccess"
          : "toast.syncFailed";
      toastFn(i18n.t(toastKey, { name: game.name }));
      return result;
    } catch (error) {
      useSyncStore.getState().setGameStatus(game.name, SYNC_STATUS.error);
      toast.error(i18n.t("toast.syncFailed", { name: game.name }));
      throw error;
    }
  };
};
