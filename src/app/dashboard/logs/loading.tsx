import {
  SkeletonHeader,
  SkeletonTable,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
