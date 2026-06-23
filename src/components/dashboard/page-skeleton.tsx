import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Briques de squelette réutilisables, affichées instantanément pendant le
 * chargement serveur d'une page (loading.tsx) pour épouser sa vraie structure.
 */

export function SkeletonHeader({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72 max-w-[60vw]" />
      </div>
      {action ? <Skeleton className="h-8 w-32 rounded-lg" /> : null}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-xl", className)} />;
}

export function SkeletonCards({
  count = 2,
  height = "h-44",
}: {
  count?: number;
  height?: string;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("rounded-xl", height)} />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="rounded-xl border">
      <div className="border-b p-4">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton
                key={j}
                className={cn("h-4", j === 0 ? "w-32" : "flex-1")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTabs({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-lg" />
      ))}
    </div>
  );
}

/** Squelette générique de repli (header + cartes + bloc). */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonStatCards />
      <SkeletonCard className="h-72" />
    </div>
  );
}
