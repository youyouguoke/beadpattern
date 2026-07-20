export function AdminSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-container rounded w-3/4" />
          <div className="h-4 bg-surface-container rounded w-1/2" />
        </div>
      ))}
    </>
  );
}
