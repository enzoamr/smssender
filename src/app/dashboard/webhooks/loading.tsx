import {
  SkeletonCards,
  SkeletonHeader,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonCards count={3} height="h-44" />
    </div>
  );
}
