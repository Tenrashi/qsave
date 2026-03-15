import { useTranslation } from "react-i18next";
import { CheckCircle, AlertCircle, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSyncHistory } from "@/hooks/useSyncHistory";
import { dateFnsLocales } from "@/lib/date-locales";
import { MAX_RECENT_ENTRIES } from "./SyncHistory.const";

export const SyncHistory = () => {
  const { t, i18n } = useTranslation();
  const { data: history = [] } = useSyncHistory();
  const recent = history.slice(0, MAX_RECENT_ENTRIES);
  const locale = dateFnsLocales[i18n.language] ?? enUS;

  if (recent.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          {t("history.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-40">
          <div className="space-y-1">
            {recent.map((record) => (
              <div key={record.id} className="flex items-center gap-3 py-1.5 text-sm">
                {record.status === "success" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                )}
                <span className="truncate">{record.gameName}</span>
                <span className="text-muted-foreground text-xs ml-auto shrink-0">
                  {formatDistanceToNow(new Date(record.syncedAt), { addSuffix: true, locale })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
