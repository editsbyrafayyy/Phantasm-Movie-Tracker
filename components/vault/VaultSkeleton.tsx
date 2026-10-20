/** Mirrors the vault layout: header, makeup bar, toolbar, poster grid. */
export function VaultSkeleton({ count = 15 }: { count?: number }) {
  return (
    <div className="vault-skeleton" aria-busy="true" aria-label="Loading vault">
      <div className="vault-content vault-head">
        <div className="vault-skel-header">
          <div className="skeleton vault-skel-eyebrow" />
          <div className="skeleton vault-skel-title" />
        </div>
      </div>
      <div className="vault-content">
        <div className="skeleton vault-skel-makeup" />
        <div className="vault-skel-toolbar">
          <div className="skeleton vault-skel-search" />
          <div className="vault-skel-controls">
            <div className="skeleton vault-skel-sort" />
            <div className="skeleton vault-skel-filters" />
            <div className="skeleton vault-skel-icon" />
            <div className="skeleton vault-skel-icon" />
          </div>
        </div>
        <div className="movie-grid vault-movie-grid">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="skeleton vault-skel-card"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
