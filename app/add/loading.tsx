export default function AddLoading() {
  return (
    <div className="page-container form-page" style={{ maxWidth: 600, margin: '0 auto', padding: '100px 24px 80px' }}>
      {/* ── Form Header Skeleton ──────────────────────────────── */}
      <header className="form-header" style={{ marginBottom: 36 }}>
        <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 3, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 160, height: 38, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 280, height: 14, borderRadius: 4 }} />
      </header>

      {/* ── Form Sections Skeleton ────────────────────────────── */}
      <div className="movie-form" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Title Input */}
        <div className="form-section">
          <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 3, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 8 }} />
        </div>

        {/* Subgenre Dropdown */}
        <div className="form-section">
          <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 3, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 8 }} />
        </div>

        {/* Secondary Tag Dropdown */}
        <div className="form-section">
          <div className="skeleton" style={{ width: 110, height: 14, borderRadius: 3, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 8 }} />
        </div>

        {/* Recommendation 4-Pill Selector */}
        <div className="form-section">
          <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 3, marginBottom: 10 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
          </div>
        </div>

        {/* 8 Score Breakdown Fields in 2x4 Grid */}
        <div className="form-section">
          <div className="skeleton" style={{ width: 130, height: 14, borderRadius: 3, marginBottom: 12 }} />
          <div className="score-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ))}
          </div>
        </div>

        {/* Bonus Toggle */}
        <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 8 }} />

        {/* Personal Notes Textarea */}
        <div className="form-section">
          <div className="skeleton" style={{ width: 110, height: 14, borderRadius: 3, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 80, borderRadius: 8 }} />
        </div>

        {/* Submit Button */}
        <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 8, marginTop: 8 }} />
      </div>
    </div>
  );
}
