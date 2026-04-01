"use client";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
      <SkeletonLine className="h-10 w-10 rounded-xl mb-3" />
      <SkeletonLine className="h-7 w-24 mb-2" />
      <SkeletonLine className="h-4 w-32 mb-1" />
      <SkeletonLine className="h-3 w-28" />
    </div>
  );
}

export function SkeletonChart({ height = 320 }: { height?: number }) {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
      <SkeletonLine className="h-5 w-40 mb-2" />
      <SkeletonLine className="h-4 w-56 mb-6" />
      <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" style={{ height }} />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonChart height={320} />
      <SkeletonChart height={200} />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center gap-3">
        <SkeletonLine className="h-10 w-10 rounded-xl" />
        <div>
          <SkeletonLine className="h-7 w-32 mb-1" />
          <SkeletonLine className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonChart height={240} />
      <SkeletonChart height={200} />
    </div>
  );
}
