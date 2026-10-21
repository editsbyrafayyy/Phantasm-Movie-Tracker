/**
 * Mirrors app/profile/page.tsx: hero card (identity, four headline numbers,
 * verdict bar), the stats grid, then account settings.
 */
export default function ProfileLoading() {
  return (
    <div className="profile-page page-container" aria-busy="true" aria-label="Loading profile">
      <section className="profile-hero">
        <div className="profile-user-header">
          <div className="skeleton skel-profile-avatar" />
          <div className="profile-info">
            <div className="skeleton skel-profile-name" />
            <div className="skeleton skel-profile-meta" />
          </div>
        </div>
        <div className="profile-headline">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="profile-headline-item">
              <div className="skeleton skel-profile-label" />
              <div className="skeleton skel-profile-num" />
            </div>
          ))}
        </div>
        <div className="skeleton skel-profile-bar" />
      </section>

      <section className="profile-section">
        <div className="skeleton skel-profile-head" />
        <div className="profile-grid">
          <div className="skeleton skel-profile-card is-short stat-card-wide" />
          <div className="skeleton skel-profile-card stat-card-wide" />
          <div className="skeleton skel-profile-card" />
          <div className="skeleton skel-profile-card" />
        </div>
      </section>
    </div>
  );
}
