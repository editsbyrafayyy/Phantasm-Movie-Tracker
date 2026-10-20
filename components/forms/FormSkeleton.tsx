/** Loading placeholder shared by the add / update rating forms. */
export default function FormSkeleton({ withSubtitle = false }: { withSubtitle?: boolean }) {
  return (
    <div className="page-container form-page" aria-busy="true" aria-label="Loading form">
      <div className="page-header">
        <div className="page-header-text">
          <div className="skeleton skel-title" />
          {withSubtitle && <div className="skeleton skel-line skel-line-wide" />}
        </div>
      </div>

      <div className="movie-form">
        {[0, 1, 2].map(i => (
          <div key={i} className="form-section">
            <div className="skeleton skel-label" />
            <div className="skeleton skel-input" />
          </div>
        ))}

        <div className="form-section">
          <div className="skeleton skel-label" />
          <div className="skel-pill-row">
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton skel-pill" />)}
          </div>
        </div>

        <div className="form-section">
          <div className="skeleton skel-label" />
          <div className="score-grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton skel-score" />)}
          </div>
        </div>

        <div className="skeleton skel-input" />
        <div className="skeleton skel-total" />
        <div className="skeleton skel-button" />
      </div>
    </div>
  );
}
