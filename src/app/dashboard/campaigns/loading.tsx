import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonTable,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonCard className="h-72" />
      <SkeletonTable rows={5} columns={6} />
    </div>
  );
}
