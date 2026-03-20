import { Skeleton } from "@/components/ui/skeleton";

export const BackupsSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} className="h-10 w-full" />
    ))}
  </div>
);
