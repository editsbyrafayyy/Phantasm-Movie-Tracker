export default function AddLoading() {
  return (
    <div className="add-page page-container" style={{ maxWidth: 600, margin: '0 auto' }}>
      <header className="form-header">
        <div className="skeleton h-4 w-12 mb-2" />
        <div className="skeleton h-10 w-48" />
      </header>

      <div className="form-section">
        {/* Search Input Skeleton */}
        <div className="skeleton h-12 w-full mb-8" />

        {/* Form Fields Skeletons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-12 w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-12 w-full" />
            </div>
            <div>
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-12 w-full" />
            </div>
          </div>

          <div>
            <div className="skeleton h-4 w-32 mb-4" />
            <div className="grid grid-cols-4 gap-2">
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          </div>

          <div>
            <div className="skeleton h-4 w-40 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          </div>

          <div className="skeleton h-14 w-full mt-4" />
        </div>
      </div>
    </div>
  );
}
