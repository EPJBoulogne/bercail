export function SkeletonBar({ width = "100%" }: { width?: string }) {
  return (
    <div className="h-4 rounded bg-gray-200 animate-pulse my-2.5" style={{ width }} />
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBar key={i} width={`${55 + Math.random() * 35}%`} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}