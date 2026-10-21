export function BrowseGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="browse-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="browse-card-skeleton">
          <div className="skeleton browse-card-skeleton-poster" style={{ animationDelay: `${i * 35}ms` }} />
          <div className="skeleton browse-card-skeleton-line" />
          <div className="skeleton browse-card-skeleton-line is-short" />
        </div>
      ))}
    </div>
  );
}

const CHIP_WIDTHS = [52, 84, 118, 190, 150];

/** Route-level skeleton for /stream — mirrors BrowseGrid's layout box for box. */
export default function BrowseSkeleton() {
  return (
    <div className="browse-layout" aria-busy="true" aria-label="Loading">
      <aside className="browse-genre-rail browse-genre-rail--skeleton" aria-hidden="true">
        <div className="skeleton browse-skel-line is-label" />
        <div className="browse-skel-rail-items">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`skeleton browse-skel-line${i === 3 ? ' is-active' : ''}`} />
          ))}
        </div>
      </aside>

      <div className="browse-container browse-container--inset">
        <div className="page-header" aria-hidden="true">
          <div className="page-header-text">
            <div className="skeleton browse-skel-title" />
            <div className="skeleton browse-skel-sub" />
          </div>
        </div>

        {/* Phones only (the rail replaces it on desktop) */}
        <div className="browse-genre-chips" aria-hidden="true">
          {CHIP_WIDTHS.map((w, i) => (
            <div key={i} className="skeleton browse-skel-chip" style={{ width: w }} />
          ))}
        </div>

        <div className="browse-toolbar" aria-hidden="true">
          <div className="skeleton browse-skel-segmented" />
          <div className="skeleton browse-skel-search" />
          <div className="skeleton browse-skel-button" />
        </div>

        <div className="browse-results-wrap">
          <BrowseGridSkeleton />
        </div>
      </div>
    </div>
  );
}
