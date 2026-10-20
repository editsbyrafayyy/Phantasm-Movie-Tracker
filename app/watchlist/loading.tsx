export default function WatchlistLoading() {
  return (
    <div className="page-container watchlist-page" aria-busy="true" aria-label="Loading watchlist">
      <div className="page-header">
        <div className="page-header-text">
          <div className="skeleton skel-title" />
          <div className="skeleton skel-line" />
        </div>
      </div>

      <div className="list-toolbar">
        <div className="skeleton skel-input list-toolbar-search" />
        <div className="skel-pill-row">
          {[0, 1, 2].map(i => <div key={i} className="skeleton skel-chip" />)}
        </div>
      </div>

      <div className="watchlist-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="watchlist-card">
            <div className="skeleton watchlist-card-poster" />
            <div className="skeleton skel-line skel-line-name" />
            <div className="skeleton skel-line skel-line-short" />
          </div>
        ))}
      </div>
    </div>
  );
}
