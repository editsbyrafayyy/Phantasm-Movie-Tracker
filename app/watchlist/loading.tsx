/** Mirrors WatchlistClient: header + count, search / type chips / sort, poster grid. */
const CHIP_WIDTHS = [46, 60, 44]; // All · Films · TV

export default function WatchlistLoading() {
  return (
    <div className="page-container watchlist-page" aria-busy="true" aria-label="Loading watchlist">
      <div className="page-header page-header-page">
        <div className="page-header-text">
          <div className="skeleton skel-page-title" />
          <div className="skeleton skel-page-sub" style={{ width: 110 }} />
        </div>
      </div>

      <div className="list-toolbar" aria-hidden="true">
        <div className="list-toolbar-search"><div className="skeleton skel-control" /></div>
        <div className="list-toolbar-chips">
          {CHIP_WIDTHS.map((w, i) => <div key={i} className="skeleton skel-watchlist-chip" style={{ width: w }} />)}
        </div>
        <div className="list-toolbar-sort"><div className="skeleton skel-control skel-watchlist-sort" /></div>
      </div>

      <div className="watchlist-grid" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="watchlist-card">
            <div className="skeleton skel-watchlist-poster" />
            <div className="watchlist-card-body">
              <div className="watchlist-card-info">
                <div className="skeleton skel-watchlist-title" />
                <div className="skeleton skel-watchlist-meta" />
              </div>
              <div className="skel-watchlist-actions" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
