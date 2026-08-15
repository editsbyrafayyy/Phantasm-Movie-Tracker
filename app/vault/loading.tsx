export default function VaultLoading() {
  return (
    <div className="vault-page">
      {/* ── Vault Header Skeleton ─────────────────────────────── */}
      <header className="vault-header">
        <div className="vault-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="skeleton" style={{ width: 160, height: 38, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 64, height: 24, borderRadius: 12 }} />
          </div>
        </div>
      </header>

      {/* ── Vault Filters & Search Skeleton ───────────────────── */}
      <div className="vault-filters-wrapper" style={{ padding: '0 48px', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          {/* Search bar */}
          <div className="skeleton" style={{ flex: '1 1 280px', height: 42, borderRadius: 8 }} />
          {/* Dropdown selects */}
          <div className="skeleton" style={{ width: 140, height: 42, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 140, height: 42, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 160, height: 42, borderRadius: 8 }} />
        </div>

        {/* Subgenre pills strip skeleton */}
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden', paddingBottom: 4 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 110, height: 32, borderRadius: 16, flexShrink: 0, animationDelay: `${i * 40}ms` }} />
          ))}
        </div>
      </div>

      {/* ── Movie Grid Skeleton ───────────────────────────────── */}
      <div className="vault-grid-container" style={{ padding: '0 48px 80px' }}>
        <div className="movie-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="movie-card-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 2:3 Aspect ratio poster container */}
              <div
                className="skeleton"
                style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  borderRadius: 10,
                  animationDelay: `${i * 40}ms`,
                  position: 'relative',
                }}
              >
                {/* Floating score badge placeholder */}
                <div
                  className="skeleton"
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    width: 48,
                    height: 22,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Title & Metadata lines */}
              <div className="skeleton" style={{ height: 14, width: '85%', borderRadius: 4, animationDelay: `${i * 40 + 20}ms` }} />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 3, animationDelay: `${i * 40 + 40}ms` }} />
                <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 3, animationDelay: `${i * 40 + 60}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
