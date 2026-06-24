import {
  SkeletonCard,
  SkeletonHeader,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonCard className="h-80" />
      <SkeletonCard className="h-48" />
    </div>
  );
}
