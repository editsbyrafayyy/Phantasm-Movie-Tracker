export default function StreamDetailLoading() {
  return (
    <div className="detail-v3-page">
      {/* ── Backdrop Hero Skeleton ─────────────────────────────── */}
      <div className="backdrop-hero" style={{ background: '#0a0a0a', position: 'relative' }}>
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0, opacity: 0.35 }} />
        <div className="backdrop-hero-gradient" />

        <div className="backdrop-hero-content">
          <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 4, marginBottom: 14 }} />
          <div className="skeleton" style={{ width: 'clamp(280px, 55%, 600px)', height: 48, borderRadius: 6, marginBottom: 16 }} />

          <div className="backdrop-meta" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <div className="skeleton" style={{ width: 45, height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 65, height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 80, height: 16, borderRadius: 4 }} />
          </div>

          <div className="backdrop-actions" style={{ display: 'flex', gap: 10 }}>
            <div className="skeleton" style={{ width: 130, height: 42, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 130, height: 42, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 130, height: 42, borderRadius: 8 }} />
          </div>
        </div>
      </div>

      {/* ── Overview Grid Skeleton ─────────────────────────────── */}
      <div className="detail-overview-grid">
        <div className="detail-overview-main">
          {/* Plot */}
          <div style={{ marginBottom: 36 }}>
            <div className="skeleton" style={{ width: '100%', height: 16, borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '92%', height: 16, borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '68%', height: 16, borderRadius: 4 }} />
          </div>

          {/* Cast Subsection Skeleton */}
          <div className="detail-subsection" style={{ marginBottom: 40 }}>
            <div className="skeleton" style={{ width: 60, height: 18, borderRadius: 4, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ width: 130, flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '80%', height: 12, borderRadius: 3, marginBottom: 4 }} />
                    <div className="skeleton" style={{ width: '50%', height: 10, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Movies Carousel Skeleton */}
          <div className="similar-section">
            <div className="skeleton" style={{ width: 140, height: 18, borderRadius: 4, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton" style={{ width: 140, height: 210, borderRadius: 8, animationDelay: `${i * 45}ms` }} />
                  <div className="skeleton" style={{ width: '80%', height: 12, borderRadius: 3 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <aside className="detail-sidebar-v3">
          <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 12, marginBottom: 20 }} />
        </aside>
      </div>
    </div>
  );
}
