/**
 * Skeleton for the player page. Mirrors VideoPlayerClient's movie layout box for box:
 * title row, 16:9 player, icon buttons, notice, server grid | poster card, title,
 * synopsis, genres, trailer and cast in the sidebar.
 */
export default function WatchLoading() {
  return (
    <div className="watch-page watch-skel" aria-busy="true" aria-label="Loading player">
      <div className="watch-layout" aria-hidden="true">
        <div className="watch-player-col watch-skel-col">
          <div className="watch-skel-header">
            <div className="skeleton watch-skel-chevron" />
            <div className="skeleton watch-skel-title" />
          </div>

          <div className="skeleton watch-skel-player" />

          <div className="watch-skel-actions">
            <div className="skeleton watch-skel-icon" />
            <div className="skeleton watch-skel-icon" />
          </div>

          <div className="skeleton watch-skel-notice" />

          <div className="watch-skel-servers">
            <div className="skeleton watch-skel-label" />
            <div className="watch-skel-server-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton watch-skel-server" />
              ))}
            </div>
          </div>
        </div>

        <aside className="watch-skel-sidebar">
          <div className="watch-skel-poster-card">
            <div className="skeleton watch-skel-poster" />
            <div className="watch-skel-facts">
              <div className="skeleton watch-skel-line is-70" />
              <div className="skeleton watch-skel-line is-90" />
              <div className="skeleton watch-skel-line is-60" />
            </div>
          </div>

          <div>
            <div className="skeleton watch-skel-name" />
            <div className="skeleton watch-skel-line is-20" />
          </div>

          <div className="skeleton watch-skel-plot" />

          <div className="watch-skel-tags">
            <div className="skeleton watch-skel-tag" />
            <div className="skeleton watch-skel-tag" />
          </div>

          <div className="watch-skel-section">
            <div className="skeleton watch-skel-label" />
            <div className="skeleton watch-skel-trailer" />
          </div>

          <div className="watch-skel-section">
            <div className="skeleton watch-skel-label" />
            <div className="watch-skel-cast">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="watch-skel-cast-item">
                  <div className="skeleton watch-skel-avatar" />
                  <div className="watch-skel-cast-lines">
                    <div className="skeleton watch-skel-line is-60" />
                    <div className="skeleton watch-skel-line is-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
