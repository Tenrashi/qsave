import { useTranslation } from "react-i18next";
import { Gamepad2 } from "lucide-react";
import type { Game } from "@/domain/types";
import { GameCard } from "@/components/GameCard/GameCard";

export type SavesListProps = {
  games: Game[];
};

export const SavesList = ({ games }: SavesListProps) => {
  const { t } = useTranslation();

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Gamepad2 className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-base font-medium">{t("games.noGamesDetected")}</p>
        <p className="text-sm mt-1">{t("games.noGamesHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {games.map((game) => (
        <GameCard key={game.name} game={game} />
      ))}
    </div>
  );
};
