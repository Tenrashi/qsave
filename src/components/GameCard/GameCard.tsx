import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, AlertCircle, Loader2, FolderOpen, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth";
import { useSyncStore } from "@/stores/sync";
import type { Game, SyncStatus } from "@/domain/types";
import { syncGame } from "@/services/sync";
import { computeGameHash } from "@/lib/hash";
import { dateFnsLocales } from "@/lib/date-locales";
import { GameBanner } from "./GameBanner/GameBanner";
import { formatSize } from "./utils/formatSize";

const SyncStatusIcon = ({ status, isSynced }: { status: SyncStatus; isSynced: boolean }) => {
  if (status === "syncing") return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
  if (status === "error") return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
  if (isSynced) return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
  return null;
};

export type GameCardProps = {
  game: Game;
};

export const GameCard = memo(({ game }: GameCardProps) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { auth } = useAuthStore();
  const {
    gameStatuses,
    setGameStatus,
    isGameWatched,
    toggleGameWatch,
    syncFingerprints,
    updateSyncFingerprint,
  } = useSyncStore();
  const locale = dateFnsLocales[i18n.language] ?? enUS;
  const status = gameStatuses[game.name] ?? "idle";
  const isSyncing = status === "syncing";
  const watched = isGameWatched(game.name);

  const currentHash = computeGameHash(game.saveFiles);
  const isSynced = syncFingerprints[game.name]?.hash === currentHash;

  const totalSize = game.saveFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
  const lastModified = game.saveFiles.reduce(
    (latest, f) => (f.lastModified > latest ? f.lastModified : latest),
    new Date(0),
  );

  const handleSync = async () => {
    setGameStatus(game.name, "syncing");
    try {
      const result = await syncGame(game);
      const newStatus = result.status === "error" ? "error" : "success";
      setGameStatus(game.name, newStatus);
      if (newStatus === "success") {
        await updateSyncFingerprint(game.name, currentHash);
      }
    } catch {
      setGameStatus(game.name, "error");
    }
    queryClient.invalidateQueries({ queryKey: ["syncHistory"] });
  };

  return (
    <Card className="overflow-hidden !py-0">
      <div className="flex items-center h-14">
        <GameBanner steamId={game.steamId} />
        <div className="flex items-center justify-between flex-1 min-w-0 pl-2 pr-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium truncate">{game.name}</span>
            <SyncStatusIcon status={status} isSynced={isSynced} />
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3 h-3" />
              <span>{formatSize(totalSize)}</span>
            </div>
            <span>{formatDistanceToNow(lastModified, { addSuffix: true, locale })}</span>
            {auth.isAuthenticated && (
              <>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label={watched ? t("games.unwatchTooltip") : t("games.watchTooltip")}
                        onClick={() => toggleGameWatch(game.name)}
                      />
                    }
                  >
                    {watched ? (
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {watched ? t("games.unwatchTooltip") : t("games.watchTooltip")}
                  </TooltipContent>
                </Tooltip>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {t("games.sync")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});
