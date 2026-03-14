import { useQuery } from "@tanstack/react-query";
import { getSyncHistory } from "@/lib/store";

export const useSyncHistory = () => {
  return useQuery({
    queryKey: ["syncHistory"],
    queryFn: getSyncHistory,
  });
};
