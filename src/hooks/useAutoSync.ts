import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Game } from "@/domain/types";
import { useSyncStore } from "@/stores/sync";
import { useAuthStore } from "@/stores/auth";
import { startWatching, stopWatching } from "@/lib/watcher";
import { scheduleAutoSync, cancelAllAutoSyncs } from "@/lib/autoSync";
import { computeGameHash } from "@/lib/hash";
import { syncGame } from "@/services/sync";

export const useAutoSync = (
  games: Game[] | undefined,
  globalWatchEnabled: boolean,
  refetch: () => void,
): void => {
  const queryClient = useQueryClient();
  const gamesRef = useRef<Game[]>([]);
  gamesRef.current = games ?? [];

  const {
    isGameWatched,
    gameStatuses,
    setGameStatus,
    syncFingerprints,
    updateSyncFingerprint,
  } = useSyncStore();
  const { auth } = useAuthStore();

  // Keep refs to avoid stale closures in the watcher callback
  const storeRef = useRef({ isGameWatched, gameStatuses, syncFingerprints, setGameStatus, updateSyncFingerprint, auth });
  storeRef.current = { isGameWatched, gameStatuses, syncFingerprints, setGameStatus, updateSyncFingerprint, auth };

  useEffect(() => {
    if (!globalWatchEnabled || !games?.length) {
      stopWatching();
      cancelAllAutoSyncs();
      return;
    }

    // Build dir -> gameName lookup
    const dirToGame = new Map<string, string>();
    for (const game of games) {
      for (const dir of game.savePaths) {
        dirToGame.set(dir, game.name);
      }
    }

    const dirs = games.flatMap((g) => g.savePaths);

    startWatching(dirs, (changedPaths) => {
      refetch();

      const store = storeRef.current;
      if (!store.auth.isAuthenticated) return;

      // Find which games were affected
      const affectedGames = new Set<string>();
      for (const changed of changedPaths) {
        for (const [dir, gameName] of dirToGame) {
          if (!changed.startsWith(dir)) continue;
          affectedGames.add(gameName);
        }
      }

      for (const gameName of affectedGames) {
        if (!store.isGameWatched(gameName)) continue;
        if (store.gameStatuses[gameName] === "syncing") continue;

        scheduleAutoSync(gameName, () => {
          const currentGame = gamesRef.current.find((g) => g.name === gameName);
          if (!currentGame) return;

          const currentStore = storeRef.current;
          const hash = computeGameHash(currentGame.saveFiles);
          const existing = currentStore.syncFingerprints[gameName];
          if (existing?.hash === hash) return;

          currentStore.setGameStatus(gameName, "syncing");
          syncGame(currentGame)
            .then((record) => {
              const status = record.status === "error" ? "error" : "success";
              currentStore.setGameStatus(gameName, status);
              if (status === "success") {
                currentStore.updateSyncFingerprint(gameName, hash);
              }
              queryClient.invalidateQueries({ queryKey: ["syncHistory"] });
            })
            .catch(() => {
              currentStore.setGameStatus(gameName, "error");
            });
        });
      }
    });

    return () => {
      stopWatching();
      cancelAllAutoSyncs();
    };
  }, [globalWatchEnabled, games]);
};
