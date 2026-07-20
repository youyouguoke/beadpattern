export default function PatternSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28 space-y-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-square bg-surface-container rounded-3xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface-container rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="h-8 w-3/4 bg-surface-container rounded-xl" />
          <div className="h-4 w-1/2 bg-surface-container rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-surface-container rounded-lg" />
            ))}
          </div>
          <div className="h-24 bg-surface-container rounded-2xl" />
          <div className="h-12 bg-surface-container rounded-full" />
          <div className="h-12 bg-surface-container rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="h-8 w-1/3 bg-surface-container rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-surface-container rounded-lg" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="h-64 bg-surface-container rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
