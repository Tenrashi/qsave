import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { scanForGames } from "@/operations/scanner/scanner/scanner";
import { QUERY_KEYS } from "@/lib/constants/constants";

export const useGames = () => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: QUERY_KEYS.games,
    queryFn: scanForGames,
    staleTime: 30_000,
    meta: { errorMessage: t("toast.scanFailed") },
  });
};
