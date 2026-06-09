export default function MovieDetailLoading() {
  return (
    <div className="movie-detail-v3">
      {/* Hero Section Skeleton */}
      <div className="md-hero skeleton" style={{ height: '70vh', borderRadius: 0 }}>
        <div className="md-hero-content">
          <div className="skeleton h-12 w-1/3 mb-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex gap-4 mb-6">
            <div className="skeleton h-6 w-20" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="skeleton h-6 w-24" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="page-container" style={{ marginTop: '-100px', position: 'relative', zIndex: 10 }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Score Card */}
          <div className="lg:col-span-5">
            <div className="skeleton h-[500px] w-full rounded-2xl" />
          </div>

          {/* Right: Info & Similar */}
          <div className="lg:col-span-7">
            <div className="skeleton h-8 w-48 mb-6" />
            <div className="skeleton h-32 w-full mb-12" />
            
            <div className="skeleton h-8 w-40 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton aspect-[2/3] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
