import {
  SkeletonHeader,
  SkeletonTable,
} from "@/components/dashboard/page-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonTable rows={4} columns={4} />
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}
