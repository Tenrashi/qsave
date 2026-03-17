import { useQuery } from "@tanstack/react-query";
import { getSyncHistory } from "@/lib/store";
import { QUERY_KEYS } from "@/lib/constants";

export const useSyncHistory = () => {
  return useQuery({
    queryKey: QUERY_KEYS.syncHistory,
    queryFn: getSyncHistory,
  });
};
