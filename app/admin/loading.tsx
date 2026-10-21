/** Mirrors app/admin/page.tsx: header, overview strip, members table, cards. */
export default function AdminLoading() {
  return (
    <div className="admin-page page-container" aria-busy="true" aria-label="Loading admin">
      <div className="page-header page-header-page">
        <div className="page-header-text"><div className="skeleton skel-page-title" /></div>
      </div>
      <div className="profile-headline admin-overview">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="profile-headline-item">
            <div className="skeleton skel-profile-label" />
            <div className="skeleton skel-profile-num" />
          </div>
        ))}
      </div>
      <div className="admin-grid">
        <div className="skeleton skel-profile-card is-short stat-card-wide" />
        <div className="skeleton skel-profile-card" />
        <div className="skeleton skel-profile-card" />
      </div>
    </div>
  );
}
