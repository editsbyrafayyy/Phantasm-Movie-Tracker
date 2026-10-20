/** Mirrors MovieDetailV3: backdrop hero, then main column + score sidebar. */
export default function MovieDetailLoading() {
  return (
    <div className="detail-v3-page vault-detail" aria-busy="true" aria-label="Loading film">
      <div className="backdrop-hero detail-skel-hero">
        <div className="backdrop-hero-gradient" />
        <div className="backdrop-hero-content">
          <div className="skeleton detail-skel-eyebrow" />
          <div className="skeleton detail-skel-title" />
          <div className="detail-skel-row">
            <div className="skeleton detail-skel-chip" />
            <div className="skeleton detail-skel-chip is-short" />
          </div>
          <div className="skeleton detail-skel-meta" />
          <div className="skeleton detail-skel-score" />
          <div className="detail-skel-row">
            <div className="skeleton detail-skel-btn is-primary" />
            <div className="skeleton detail-skel-btn" />
            <div className="skeleton detail-skel-btn" />
          </div>
        </div>
      </div>

      <div className="detail-overview-grid">
        <div className="detail-overview-main">
          <div className="detail-skel-lines">
            <div className="skeleton detail-skel-line" />
            <div className="skeleton detail-skel-line" />
            <div className="skeleton detail-skel-line is-short" />
          </div>
          <div className="score-bars">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton detail-skel-bar" />
            ))}
          </div>
        </div>
        <aside className="detail-overview-side">
          <div className="skeleton detail-skel-card" />
          <div className="skeleton detail-skel-card is-tall" />
        </aside>
      </div>
    </div>
  );
}
