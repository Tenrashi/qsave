import { useQuery } from "@tanstack/react-query";
import { listGameBackups } from "@/services/drive/drive";

export const GAME_BACKUPS_KEY = (gameName: string) => ["gameBackups", gameName];

export const useGameBackups = (gameName: string, enabled: boolean) => {
  return useQuery({
    queryKey: GAME_BACKUPS_KEY(gameName),
    queryFn: () => listGameBackups(gameName),
    enabled,
    gcTime: 0,
  });
};
