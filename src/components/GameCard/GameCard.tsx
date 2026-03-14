import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight, Gamepad2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth";
import { useSyncStore } from "@/stores/sync";
import type { Game, SaveFile, SyncStatus } from "@/domain/types";
import { syncFile, syncGame } from "@/services/sync.service";
import { dateFnsLocales } from "@/lib/date-locales";
import { formatSize } from "./utils/formatSize";
import { useState } from "react";

const SyncStatusIcon = ({ status }: { status: SyncStatus }) => {
  switch (status) {
    case "syncing":
      return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
    case "success":
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    case "error":
      return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    default:
      return null;
  }
};

export type GameCardProps = {
  game: Game;
};

export const GameCard = ({ game }: GameCardProps) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { auth } = useAuthStore();
  const { fileStatuses, setStatus, setBulkStatus } = useSyncStore();
  const [open, setOpen] = useState(false);
  const locale = dateFnsLocales[i18n.language] ?? enUS;

  const isSyncing = game.saveFiles.some((f) => fileStatuses[f.path] === "syncing");

  const handleSyncFile = async (file: SaveFile) => {
    setStatus(file.path, "syncing");
    const result = await syncFile(file);
    setStatus(file.path, result.status);
    queryClient.invalidateQueries({ queryKey: ["syncHistory"] });
  };

  const handleSyncAll = async () => {
    setBulkStatus(game.saveFiles.map((f) => f.path), "syncing");
    await syncGame(game);
    setBulkStatus(game.saveFiles.map((f) => f.path), "success");
    queryClient.invalidateQueries({ queryKey: ["syncHistory"] });
  };

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-4 py-3">
          <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer flex-1 min-w-0">
            {open ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <Gamepad2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{game.name}</span>
            <Badge variant="outline" className="shrink-0">
              {t("games.save", { count: game.saveFiles.length })}
            </Badge>
          </CollapsibleTrigger>
          {auth.isAuthenticated && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="ml-3 shrink-0"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1.5" />
              )}
              {t("games.syncAll")}
            </Button>
          )}
        </div>

        <CollapsibleContent>
          <Separator />
          <div className="divide-y divide-border">
            {game.saveFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between px-4 py-2.5 pl-12 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatSize(file.sizeBytes)}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDistanceToNow(file.lastModified, { addSuffix: true, locale })}
                  </span>
                  <SyncStatusIcon status={fileStatuses[file.path] ?? "idle"} />
                </div>
                {auth.isAuthenticated && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleSyncFile(file)}
                    disabled={fileStatuses[file.path] === "syncing"}
                    title={t("games.syncToDrive")}
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
