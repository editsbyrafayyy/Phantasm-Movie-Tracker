export default function BrowseLoading() {
  return (
    <div className="browse-container">
      {/* Search and Navigation Header Skeleton */}
      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="skeleton h-10 w-64 mb-2" />
            <div className="skeleton h-5 w-80" />
          </div>

          {/* Media Type Tabs Skeleton */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
            <div className="skeleton h-8 w-24 rounded-md" />
            <div className="skeleton h-8 w-24 rounded-md" />
          </div>
        </div>

        {/* Global Search Bar Skeleton */}
        <div className="skeleton h-10 w-full max-w-[400px]" />
      </div>

      <div className="browse-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="skeleton aspect-[2/3] w-full" />
            <div className="skeleton h-4 w-3/4 mt-2" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
