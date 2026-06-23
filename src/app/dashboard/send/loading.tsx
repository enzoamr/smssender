import {
  SkeletonCard,
  SkeletonHeader,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <div className="grid gap-4 lg:grid-cols-5">
        <SkeletonCard className="h-96 lg:col-span-3" />
        <div className="space-y-4 lg:col-span-2">
          <SkeletonCard className="h-44" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    </div>
  );
}
