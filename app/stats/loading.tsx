export default function StatsLoading() {
  return (
    <div className="profile-page page-container profile-bg-glow" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px' }}>
      <header className="form-header" style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 90, height: 14, borderRadius: 3, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 220, height: 38, borderRadius: 6 }} />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12, animationDelay: `${i * 50}ms` }} />
        ))}
      </div>

      <div className="stats-charts-grid">
        <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
      </div>
    </div>
  );
}
