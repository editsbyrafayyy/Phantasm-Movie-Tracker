/** Skeleton for the TMDB stream detail page — mirrors StreamDetailV3's layout. */
export default function StreamDetailLoading() {
  return (
    <div className="detail-v3-page stream-detail" aria-busy="true" aria-label="Loading title">
      <div className="backdrop-hero stream-detail-skel-hero">
        <div className="backdrop-hero-gradient" />
        <div className="backdrop-hero-content" aria-hidden="true">
          <div className="skeleton stream-skel stream-skel-eyebrow" />
          <div className="skeleton stream-skel stream-skel-title" />
          <div className="stream-skel-row">
            <div className="skeleton stream-skel stream-skel-chip" />
            <div className="skeleton stream-skel stream-skel-chip" />
          </div>
          <div className="skeleton stream-skel stream-skel-meta" />
          <div className="stream-skel-row">
            <div className="skeleton stream-skel stream-skel-btn is-primary" />
            <div className="skeleton stream-skel stream-skel-btn" />
            <div className="skeleton stream-skel stream-skel-btn" />
          </div>
        </div>
      </div>

      <div className="detail-overview-grid" aria-hidden="true">
        <div className="detail-overview-main">
          <div className="stream-skel-plot">
            <div className="skeleton stream-skel stream-skel-text" />
            <div className="skeleton stream-skel stream-skel-text is-92" />
            <div className="skeleton stream-skel stream-skel-text is-68" />
          </div>
          <div className="detail-subsection">
            <div className="skeleton stream-skel stream-skel-heading" />
            <div className="stream-skel-cast">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="stream-skel-cast-item">
                  <div className="skeleton stream-skel-avatar" />
                  <div className="stream-skel-cast-lines">
                    <div className="skeleton stream-skel stream-skel-text is-80" />
                    <div className="skeleton stream-skel stream-skel-text is-50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="detail-overview-side">
          <div className="skeleton stream-skel-card" />
        </aside>
      </div>
    </div>
  );
}
