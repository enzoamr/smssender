import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonTable,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard className="h-52" />
        <SkeletonCard className="h-52" />
      </div>
      <SkeletonTable rows={6} columns={5} />
    </div>
  );
}
