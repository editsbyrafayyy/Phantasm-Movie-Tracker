/** Mirrors MovieDetailV3: backdrop hero, then overview + score panel + sections. */
export default function MovieDetailLoading() {
  return (
    <div className="vdetail detail-skeleton" aria-busy="true" aria-label="Loading film">
      <div className="vdetail-hero vdetail-skel-hero">
        <div className="vdetail-hero-shade" aria-hidden="true" />
        <div className="vdetail-hero-inner">
          <div className="skeleton vdetail-skel-back" />
          <div className="vdetail-hero-body">
            <div className="skeleton vdetail-skel-title" />
            <div className="skeleton vdetail-skel-meta" />
            <div className="skeleton vdetail-skel-genre" />
            <div className="skeleton vdetail-skel-score" />
            <div className="vdetail-skel-actions">
              <div className="skeleton vdetail-skel-btn is-primary" />
              <div className="skeleton vdetail-skel-btn" />
            </div>
          </div>
        </div>
      </div>

      <div className="vdetail-body">
        <div className="vdetail-top">
          <div className="vdetail-skel-lines">
            <div className="skeleton vdetail-skel-line" />
            <div className="skeleton vdetail-skel-line" />
            <div className="skeleton vdetail-skel-line is-short" />
          </div>
        </div>

        <div className="vdetail-side">
          <div className="skeleton vdetail-skel-side-title" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton vdetail-skel-bar" />
          ))}
        </div>

        <div className="vdetail-rest">
          <div className="skeleton vdetail-skel-h2" />
          <div className="vdetail-skel-row">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton vdetail-skel-avatar" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
