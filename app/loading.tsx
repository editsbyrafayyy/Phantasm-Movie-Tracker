/** Home skeleton — mirrors the hero, a poster row and the vault header. */
export default function Loading() {
  return (
    <div className="browse-page home-page" aria-busy="true" aria-label="Loading">
      <div className="hero-carousel">
        <div className="hero-placeholder home-skel-hero">
          <div className="hero-content">
            <div className="skeleton home-skel-line" style={{ width: 180 }} />
            <div className="skeleton home-skel-title" />
            <div className="skeleton home-skel-line" style={{ width: 220 }} />
            <div className="home-skel-actions">
              <div className="skeleton home-skel-btn" />
              <div className="skeleton home-skel-btn" />
            </div>
          </div>
        </div>
      </div>

      {[0, 1].map(row => (
        <section key={row} className="category-section">
          <div className="category-header">
            <div className="skeleton home-skel-line" style={{ width: 140 }} />
          </div>
          <div className="home-skel-track">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="home-skel-card">
                <div className="skeleton home-skel-poster" />
                <div className="skeleton home-skel-line" style={{ width: '80%' }} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
