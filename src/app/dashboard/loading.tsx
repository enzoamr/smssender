import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonStatCards,
  SkeletonTable,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader action />
      <SkeletonStatCards />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="h-80 lg:col-span-2" />
        <SkeletonCard className="h-80" />
      </div>
      <SkeletonTable rows={6} columns={5} />
    </div>
  );
}
