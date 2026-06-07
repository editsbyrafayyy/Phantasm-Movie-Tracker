export default function Loading() {
  return (
    <div className="detail-v3-page">
      {/* Hero Skeleton */}
      <div className="backdrop-hero" style={{ background: '#0a0a0a' }}>
        <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
        <div className="backdrop-hero-gradient" />
        <div className="backdrop-hero-content">
          <div className="h-4 w-24 bg-white/[0.05] rounded animate-pulse mb-4" />
          <div className="h-12 w-3/4 bg-white/[0.05] rounded-lg animate-pulse mb-6" />
          <div className="flex gap-2 mb-6">
            <div className="h-6 w-20 bg-white/[0.05] rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-white/[0.05] rounded-full animate-pulse" />
          </div>
          <div className="h-5 w-64 bg-white/[0.05] rounded animate-pulse" />
        </div>
      </div>

      <div className="detail-overview-grid" style={{ marginTop: 40 }}>
        <div className="detail-overview-main">
          <div className="h-4 w-full bg-white/[0.03] rounded animate-pulse mb-3" />
          <div className="h-4 w-full bg-white/[0.03] rounded animate-pulse mb-3" />
          <div className="h-4 w-2/3 bg-white/[0.03] rounded animate-pulse mb-12" />

          {/* Similar Section Skeleton */}
          <div className="h-6 w-48 bg-white/[0.05] rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        </div>

        <aside className="detail-overview-side">
          <div className="h-32 w-full bg-white/[0.03] rounded-xl animate-pulse mb-6" />
          <div className="h-48 w-full bg-white/[0.03] rounded-xl animate-pulse" />
        </aside>
      </div>
    </div>
  );
}
