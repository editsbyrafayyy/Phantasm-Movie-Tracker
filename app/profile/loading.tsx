export default function ProfileLoading() {
  return (
    <div className="profile-page page-container" aria-busy="true" aria-label="Loading profile">
      <div className="profile-column">
        <div className="page-header">
          <div className="skeleton skel-title" />
        </div>
        <div className="profile-card">
          <div className="profile-user-header">
            <div className="skeleton skel-avatar" />
            <div className="profile-info">
              <div className="skeleton skel-line skel-line-name" />
              <div className="skeleton skel-line" />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-stats-section">
        <div className="page-header page-header-section">
          <div className="skeleton skel-title skel-title-sm" />
        </div>
        <div className="summary-strip">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skel-tile" />
          ))}
        </div>
        <div className="stats-charts-grid">
          <div className="skeleton skel-card" />
          <div className="skeleton skel-card" />
          <div className="skeleton skel-card" />
          <div className="skeleton skel-card" />
          <div className="skeleton skel-card stat-card-wide" />
        </div>
      </div>
    </div>
  );
}
