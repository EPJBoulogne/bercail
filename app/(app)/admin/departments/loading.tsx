import { SkeletonCards } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-6" />
      <SkeletonCards count={3} />
    </div>
  );
}
