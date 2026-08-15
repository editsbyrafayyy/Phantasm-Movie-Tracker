export default function BrowseLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="browse-container browse-container--inset" style={{ padding: '40px 48px 80px' }}>
        {/* Header Title Skeleton */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="browse-header-container">
            <div className="skeleton" style={{ width: 240, height: 38, borderRadius: 8, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 340, height: 16, borderRadius: 4 }} />
          </div>

          {/* Controls Bar: Media toggle & Search & Mood button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8, width: 'fit-content' }}>
              <div className="skeleton" style={{ width: 85, height: 32, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 95, height: 32, borderRadius: 6 }} />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="skeleton" style={{ width: '100%', maxWidth: 400, height: 42, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 140, height: 42, borderRadius: 8 }} />
            </div>
          </div>
        </div>

        {/* Browse Grid Skeletons */}
        <div className="browse-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                className="skeleton"
                style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  borderRadius: 8,
                  animationDelay: `${i * 35}ms`,
                  position: 'relative',
                }}
              >
                <div
                  className="skeleton"
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    width: 44,
                    height: 20,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>
              <div className="skeleton" style={{ width: '85%', height: 14, borderRadius: 3, animationDelay: `${i * 35 + 20}ms` }} />
              <div className="skeleton" style={{ width: '45%', height: 11, borderRadius: 3, animationDelay: `${i * 35 + 40}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
