import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Game } from "@/domain/types";
import { SYNC_STATUS, RECORD_STATUS } from "@/domain/types";
import { QUERY_KEYS } from "@/lib/constants/constants";
import { listGameBackups } from "@/services/drive/drive";
import { restoreGame } from "@/services/restore/restore";
import { useSyncStore } from "@/stores/sync";
import { computeGameHash } from "@/lib/hash/hash";

export const useRestoreBackup = (game: Game) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setGameStatus, updateSyncFingerprint } = useSyncStore();

  return useMutation({
    mutationFn: async (backupId?: string) => {
      const resolvedId = backupId ?? (await listGameBackups(game.name))[0]?.id;

      if (!resolvedId) throw new Error(t("restore.noBackups"));

      setGameStatus(game.name, SYNC_STATUS.restoring);
      const result = await restoreGame(game, resolvedId);

      if (result.status !== RECORD_STATUS.success) {
        throw new Error(result.error ?? t("restore.error"));
      }

      return result;
    },
    onSuccess: async () => {
      try {
        setGameStatus(game.name, SYNC_STATUS.success);
        const newHash = computeGameHash(game.saveFiles);
        await updateSyncFingerprint(game.name, newHash);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.syncHistory });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.games });
      } catch {
        setGameStatus(game.name, SYNC_STATUS.error);
      }
    },
    onError: () => {
      setGameStatus(game.name, SYNC_STATUS.error);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.syncHistory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.games });
    },
  });
};
