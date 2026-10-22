import { Skeleton } from "@/components/ui/skeleton";

export const BackupsSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
      <Skeleton key={index} className="h-10 w-full" />
    ))}
  </div>
);
