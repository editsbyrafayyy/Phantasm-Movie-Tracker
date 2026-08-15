export default function ProfileLoading() {
  return (
    <div className="profile-page page-container profile-bg-glow" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px' }}>
      {/* ── Profile Details Card Skeleton (560px centered) ────── */}
      <div style={{ maxWidth: 560, margin: '0 auto 48px auto' }}>
        <header className="form-header" style={{ marginBottom: 24 }}>
          <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 3, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 160, height: 38, borderRadius: 6 }} />
        </header>

        <div className="profile-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Avatar Circle */}
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ width: 160, height: 22, borderRadius: 4 }} />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 90, height: 14, borderRadius: 3 }} />
                <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Embedded Stats Section Skeleton ───────────────────── */}
      <div className="profile-stats-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 48, marginTop: 16 }}>
        <header className="form-header" style={{ marginBottom: 32 }}>
          <div className="skeleton" style={{ width: 90, height: 14, borderRadius: 3, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 220, height: 38, borderRadius: 6 }} />
        </header>

        {/* Summary Metric Strip Skeleton (4 cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12, animationDelay: `${i * 50}ms` }} />
          ))}
        </div>

        {/* Stats Charts Grid Skeleton */}
        <div className="stats-charts-grid">
          <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 260, borderRadius: 12, gridColumn: '1 / -1' }} />
          <div className="skeleton" style={{ height: 260, borderRadius: 12, gridColumn: '1 / -1' }} />
          <div className="skeleton" style={{ height: 180, borderRadius: 12, gridColumn: '1 / -1' }} />
        </div>
      </div>
    </div>
  );
}
