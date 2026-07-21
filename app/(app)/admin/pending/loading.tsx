import { SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <SkeletonRows count={3} />
    </div>
  );
}
