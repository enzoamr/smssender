import {
  SkeletonHeader,
  SkeletonTable,
  SkeletonTabs,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader action />
      <SkeletonTabs />
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}
