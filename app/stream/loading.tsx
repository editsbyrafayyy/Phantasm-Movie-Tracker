export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Hero Skeleton */}
      <div className="hero-carousel" style={{ background: '#0a0a0a' }}>
        <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
        <div className="hero-content">
          <div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse mb-4" />
          <div className="h-12 w-2/3 bg-white/[0.05] rounded-lg animate-pulse mb-6" />
          <div className="h-6 w-48 bg-white/[0.05] rounded animate-pulse mb-8" />
          <div className="flex gap-4">
            <div className="h-12 w-32 bg-white/[0.05] rounded-full animate-pulse" />
            <div className="h-12 w-32 bg-white/[0.05] rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Rows Skeletons */}
      <div style={{ paddingTop: 32, paddingBottom: 60, paddingLeft: 32 }}>
        {[1, 2, 3].map((row) => (
          <div key={row} style={{ marginBottom: 40 }}>
            <div className="h-6 w-48 bg-white/[0.05] rounded animate-pulse mb-6" />
            <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i} 
                  className="skeleton"
                  style={{ width: 180, height: 270, flexShrink: 0, animationDelay: `${i * 100}ms` }} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
