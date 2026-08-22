interface RouteSkeletonLoaderProps {
  label?: string;
  rows?: number;
}

export function RouteSkeletonLoader({ label, rows = 3 }: RouteSkeletonLoaderProps) {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {label && (
        <div className="flex items-center gap-3">
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
          <div className="h-5 w-24 bg-slate-100 rounded-md" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
      <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200" />
    </div>
  );
}
