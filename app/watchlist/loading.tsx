export default function WatchlistLoading() {
  return (
    <div className="watchlist-page">
      {/* ── Watchlist Header Skeleton ─────────────────────────── */}
      <header className="watchlist-header">
        <div className="watchlist-header-inner">
          <div className="watchlist-header-left">
            <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 3, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 180, height: 38, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 3 }} />
          </div>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        </div>
      </header>

      {/* ── Watchlist Controls Skeleton ───────────────────────── */}
      <div className="watchlist-controls" style={{ padding: '0 48px', display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="skeleton" style={{ flex: 1, minWidth: 200, height: 38, borderRadius: 8 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="skeleton" style={{ width: 55, height: 38, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 75, height: 38, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 55, height: 38, borderRadius: 8 }} />
        </div>
        <div className="skeleton" style={{ width: 130, height: 38, borderRadius: 8 }} />
      </div>

      {/* ── Watchlist Grid Skeleton ───────────────────────────── */}
      <div style={{ padding: '0 48px 80px' }}>
        <div className="watchlist-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="watchlist-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 8, animationDelay: `${i * 40}ms` }} />
              <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: 3 }} />
              <div className="skeleton" style={{ width: '50%', height: 11, borderRadius: 3 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
