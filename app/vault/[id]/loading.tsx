export default function MovieDetailLoading() {
  return (
    <div className="movie-detail-v3">
      {/* ── Backdrop Hero Skeleton ─────────────────────────────── */}
      <div className="backdrop-hero" style={{ background: '#0a0a0a', position: 'relative' }}>
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0, opacity: 0.35 }} />
        <div className="backdrop-hero-gradient" />

        <div className="backdrop-hero-content">
          {/* Eyebrow badge */}
          <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 4, marginBottom: 12 }} />

          {/* Large Title */}
          <div className="skeleton" style={{ width: 'clamp(280px, 60%, 640px)', height: 48, borderRadius: 6, marginBottom: 16 }} />

          {/* Genre chips */}
          <div className="backdrop-chips" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 120, height: 26, borderRadius: 14 }} />
            <div className="skeleton" style={{ width: 85, height: 26, borderRadius: 14 }} />
          </div>

          {/* Meta line */}
          <div className="backdrop-meta" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div className="skeleton" style={{ width: 45, height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 65, height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 75, height: 16, borderRadius: 4 }} />
          </div>

          {/* Score & Verdict badges */}
          <div className="backdrop-score-recommend-row" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 24 }}>
            <div className="skeleton" style={{ width: 130, height: 44, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 90, height: 36, borderRadius: 8 }} />
          </div>

          {/* Action buttons */}
          <div className="backdrop-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="skeleton" style={{ width: 130, height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 130, height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 130, height: 40, borderRadius: 8 }} />
          </div>
        </div>
      </div>

      {/* ── Detail Overview Grid Skeleton ───────────────────────── */}
      <div className="detail-overview-grid">
        {/* Main Content Column */}
        <div className="detail-overview-main">
          {/* Plot Paragraph */}
          <div style={{ marginBottom: 32 }}>
            <div className="skeleton" style={{ width: '100%', height: 16, borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '95%', height: 16, borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '70%', height: 16, borderRadius: 4 }} />
          </div>

          {/* Personal Note Blockquote Skeleton */}
          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 36 }}>
            <div className="skeleton" style={{ width: 110, height: 14, borderRadius: 4, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: '85%', height: 15, borderRadius: 4 }} />
          </div>

          {/* Vault Ratings 8-Criteria Section Skeleton */}
          <div className="vault-ratings-section" style={{ marginBottom: 40 }}>
            <div className="skeleton" style={{ width: 140, height: 20, borderRadius: 4, marginBottom: 20 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ width: 80, height: 13, borderRadius: 3 }} />
                    <div className="skeleton" style={{ width: 30, height: 13, borderRadius: 3 }} />
                  </div>
                  <div className="skeleton" style={{ width: '100%', height: 6, borderRadius: 3 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Similar Movies Carousel Skeleton */}
          <div className="similar-section">
            <div className="skeleton" style={{ width: 220, height: 22, borderRadius: 4, marginBottom: 18 }} />
            <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ width: 130, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton" style={{ width: 130, height: 195, borderRadius: 8, animationDelay: `${i * 50}ms` }} />
                  <div className="skeleton" style={{ width: '80%', height: 12, borderRadius: 3 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <aside className="detail-sidebar-v3">
          {/* Poster Card */}
          <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 12, marginBottom: 24 }} />

          {/* Key Details Table Skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 70, height: 12, borderRadius: 3 }} />
                <div className="skeleton" style={{ width: 110, height: 12, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
