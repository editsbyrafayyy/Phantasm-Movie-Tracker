export default function DiaryLoading() {
  return (
    <div className="page-container diary-page" style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px' }}>
      {/* ── Diary Header Skeleton ──────────────────────────────── */}
      <header className="form-header" style={{ marginBottom: 36 }}>
        <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 220, height: 42, borderRadius: 6 }} />
      </header>

      <div className="diary-feed-wrapper">
        {/* Controls / Filter Bar Skeleton */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="skeleton" style={{ flex: 1, minWidth: 200, height: 38, borderRadius: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="skeleton" style={{ width: 70, height: 38, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 110, height: 38, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 110, height: 38, borderRadius: 8 }} />
          </div>
        </div>

        {/* Feed List Items Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="diary-item-card"
              style={{
                display: 'flex',
                gap: 16,
                padding: '16px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              {/* Date */}
              <div style={{ minWidth: 95, flexShrink: 0 }}>
                <div className="skeleton" style={{ width: 65, height: 14, borderRadius: 4 }} />
              </div>

              {/* Poster */}
              <div className="skeleton" style={{ width: 44, height: 64, borderRadius: 6, flexShrink: 0 }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ width: '45%', height: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '25%', height: 12, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
