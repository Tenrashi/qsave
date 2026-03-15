import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Game } from "@/domain/types";
import { notify } from "@/lib/notify";

export const useGameDetectionNotify = (games: Game[] | undefined): void => {
  const { t } = useTranslation();
  const knownGamesRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!games?.length) return;

    const currentNames = new Set(games.map((g) => g.name));

    // First load — seed known games without notifying
    if (!knownGamesRef.current) {
      knownGamesRef.current = currentNames;
      return;
    }

    const newGames = games.filter((g) => !knownGamesRef.current!.has(g.name));
    knownGamesRef.current = currentNames;

    if (newGames.length === 0) return;

    if (newGames.length === 1) {
      notify("QSave", t("notifications.gameDetectedOne", { name: newGames[0].name }));
    } else {
      notify("QSave", t("notifications.gameDetectedOther", { count: newGames.length }));
    }
  }, [games, t]);
};
