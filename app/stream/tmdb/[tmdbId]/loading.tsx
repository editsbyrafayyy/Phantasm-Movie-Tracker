/** Skeleton for the TMDB title page — same boxes, in the same places, as StreamDetailV3. */
export default function StreamDetailLoading() {
  return (
    <div className="vdetail stream-detail detail-skeleton" aria-busy="true" aria-label="Loading title">
      <div className="vdetail-hero vdetail-skel-hero">
        <div className="vdetail-hero-shade" aria-hidden="true" />
        <div className="vdetail-hero-inner" aria-hidden="true">
          <div className="skeleton vdetail-skel-back" />
          <div className="vdetail-hero-body">
            <div className="skeleton vdetail-skel-title" />
            <div className="skeleton vdetail-skel-meta" />
            <div className="skeleton vdetail-skel-genre" />
            <div className="vdetail-skel-actions">
              <div className="skeleton vdetail-skel-btn is-primary" />
              <div className="skeleton vdetail-skel-btn" />
              <div className="skeleton vdetail-skel-btn" />
            </div>
          </div>
        </div>
      </div>

      <div className="vdetail-body" aria-hidden="true">
        <div className="vdetail-top">
          <div className="vdetail-skel-lines">
            <div className="skeleton vdetail-skel-line" />
            <div className="skeleton vdetail-skel-line" />
            <div className="skeleton vdetail-skel-line is-short" />
          </div>
        </div>

        <div className="vdetail-side">
          <div className="skeleton vdetail-skel-side-title" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton stream-skel-fact" />
          ))}
        </div>

        <div className="vdetail-rest">
          <div className="skeleton vdetail-skel-h2" />
          <div className="stream-skel-cast">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="stream-skel-cast-item">
                <div className="skeleton stream-skel-avatar" />
                <div className="skeleton stream-skel-line" />
                <div className="skeleton stream-skel-line is-short" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
