import { SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <SkeletonRows count={5} />
      </div>
    </div>
  );
}
