export default function WatchLoading() {
  return (
    <div className="watch-page">
      <div className="watch-layout">
        {/* Left Column: Video Player & Source Selection */}
        <div className="watch-player-col" style={{ padding: '24px' }}>
          {/* Header Row */}
          <div className="watch-back-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 220, height: 20, borderRadius: 4 }} />
          </div>

          {/* 16:9 Video Player Container Skeleton */}
          <div
            className="skeleton"
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 16,
            }}
          />

          {/* Under player controls row */}
          <div className="watch-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
          </div>

          {/* Warning banner placeholder */}
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 8, marginBottom: 24 }} />

          {/* Server provider grid skeleton */}
          <div className="watch-server-grid-container" style={{ marginBottom: 24 }}>
            <div className="skeleton" style={{ width: 140, height: 16, borderRadius: 4, marginBottom: 12 }} />
            <div className="watch-server-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 38, borderRadius: 8, animationDelay: `${i * 40}ms` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <aside className="watch-sidebar" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Poster & metadata */}
          <div className="watch-sidebar-poster-card" style={{ display: 'flex', gap: 16 }}>
            <div className="skeleton" style={{ width: 90, height: 130, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', flex: 1 }}>
              <div className="skeleton" style={{ width: '90%', height: 18, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: '60%', height: 13, borderRadius: 3 }} />
              <div className="skeleton" style={{ width: '40%', height: 13, borderRadius: 3 }} />
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 3, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 12, borderRadius: 3, marginBottom: 4 }} />
            <div className="skeleton" style={{ width: '90%', height: 12, borderRadius: 3, marginBottom: 4 }} />
            <div className="skeleton" style={{ width: '65%', height: 12, borderRadius: 3 }} />
          </div>

          {/* Cast Members */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <div className="skeleton" style={{ width: 90, height: 14, borderRadius: 3, marginBottom: 12 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: 12, borderRadius: 3, marginBottom: 4 }} />
                    <div className="skeleton" style={{ width: '40%', height: 10, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
