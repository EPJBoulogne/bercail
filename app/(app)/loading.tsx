import { SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-xl">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <SkeletonRows count={4} />
    </div>
  );
}
