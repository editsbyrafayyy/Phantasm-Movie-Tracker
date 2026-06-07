export default function Loading() {
  return (
    <div className="browse-container" style={{ paddingTop: 20 }}>
      {/* Header Skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div className="h-10 w-64 bg-white/[0.05] rounded-lg animate-pulse mb-4" />
        <div className="h-5 w-96 bg-white/[0.05] rounded-lg animate-pulse" />
      </div>

      {/* Grid Skeleton */}
      <div className="browse-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="skeleton aspect-[2/3]"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
