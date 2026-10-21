/**
 * Mirrors app/profile/page.tsx section by section: header, account card,
 * Statistics (year in review, summary strip, chart grid), account settings.
 */
export default function ProfileLoading() {
  return (
    <div className="profile-page page-container" aria-busy="true" aria-label="Loading profile">
      <div className="profile-column">
        <div className="page-header page-header-page">
          <div className="page-header-text"><div className="skeleton skel-page-title" /></div>
        </div>
        <div className="profile-card">
          <div className="profile-user-header">
            <div className="skeleton skel-profile-avatar" />
            <div className="profile-info">
              <div className="skeleton skel-profile-name" />
              <div className="skeleton skel-profile-handle" />
              <div className="skeleton skel-profile-meta" />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-stats-section">
        <div className="page-header page-header-section">
          <div className="page-header-text">
            <div className="skeleton skel-page-eyebrow" />
            <div className="skeleton skel-section-title" />
          </div>
        </div>

        <div className="wrapped-section">
          <div className="skeleton skel-wrapped-head" style={{ width: 'min(320px, 80%)' }} />
          <div className="wrapped-grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton skel-wrapped-card" />)}
          </div>
        </div>

        <div className="summary-strip">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton skel-summary-tile" />)}
        </div>

        {/* Same order as the page: donut, verdicts, top rated, distribution, then the wide cards */}
        <div className="stats-charts-grid">
          <div className="skeleton skel-stat-card" />
          <div className="skeleton skel-stat-card" />
          <div className="skeleton skel-stat-card" />
          <div className="skeleton skel-stat-card" />
          <div className="skeleton skel-stat-card stat-card-wide" />
          <div className="skeleton skel-stat-card is-short stat-card-wide" />
          <div className="skeleton skel-stat-card is-short stat-card-wide" />
          <div className="skeleton skel-stat-card stat-card-wide" />
        </div>
      </div>

      <div className="profile-column profile-settings">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skel-settings-block" />)}
      </div>
    </div>
  );
}
