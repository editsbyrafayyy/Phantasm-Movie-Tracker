import GuestBannerSkeleton from '@/components/home/GuestBannerSkeleton';

/**
 * Home skeleton — the boxes above the fold, matching the server render of
 * app/page.tsx: the hero's pre-hydration placeholder, the guest banner (unless
 * this browser was signed in last visit) and the first CategoryRow.
 */
export default function Loading() {
  return (
    <div className="browse-page home-page" aria-busy="true" aria-label="Loading">
      <div className="hero-carousel">
        <div className="hero-placeholder">
          <div className="skeleton hero-placeholder-poster" />
          <div className="hero-content">
            <div className="skeleton home-skel-eyebrow" />
            <div className="skeleton home-skel-title" />
            <div className="hero-score-row"><div className="skeleton home-skel-score" /></div>
            <div className="skeleton home-skel-meta" />
            <div className="hero-actions">
              <div className="skeleton home-skel-btn" />
              <div className="skeleton home-skel-btn is-secondary" />
            </div>
          </div>
        </div>
      </div>

      <GuestBannerSkeleton />

      <section className="category-section" aria-hidden="true">
        <div className="category-header">
          <div className="category-header-title-group">
            <div className="skeleton home-skel-heading" />
          </div>
          <div className="home-skel-nav" />
        </div>
        <div className="category-carousel-wrapper">
          <div className="category-scroll-track home-skel-track">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="stream-card">
                <div className="skeleton stream-card-poster home-skel-poster" />
                <div className="skeleton home-skel-card-title" />
                <div className="skeleton home-skel-card-meta" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
