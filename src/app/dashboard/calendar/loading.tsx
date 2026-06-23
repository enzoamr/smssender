import {
  SkeletonCard,
  SkeletonHeader,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SkeletonCard className="h-96" />
        <SkeletonCard className="h-96" />
      </div>
    </div>
  );
}
