/**
 * Placeholder for the shared rating form (RatingFormFields + FormSubmitBar).
 * Uses the form's own layout classes so every row lands where the real field will.
 */
export function FormFieldsSkeleton() {
  const field = (
    <>
      <div className="skeleton skel-form-label" />
      <div className="skeleton skel-field" />
    </>
  );

  return (
    <div className="movie-form" aria-hidden="true">
      <div className="form-section">{field}</div>

      <div className="form-grid-2">
        <div className="form-section">{field}</div>
        <div className="form-section">{field}</div>
      </div>

      <div className="form-section">
        <div className="skeleton skel-form-label" />
        <div className="pill-row">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton skel-form-pill" />)}
        </div>
      </div>

      <div className="form-section form-fieldset">
        <div className="skeleton skel-form-label" />
        <div className="score-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="score-entry">
              <div className="skeleton skel-form-label" />
              <div className="skeleton skel-form-score" />
            </div>
          ))}
        </div>
        <div className="skeleton skel-form-bonus" />
      </div>

      <div className="form-section">
        <div className="skeleton skel-form-label" />
        <div className="skeleton skel-form-notes" />
      </div>

      <div className="form-submit-bar">
        <div className="form-submit-row">
          <div className="form-total">
            <div className="skeleton skel-form-total-label" />
            <div className="skeleton skel-form-total-value" />
          </div>
          <div className="skeleton skel-form-submit" />
        </div>
      </div>
    </div>
  );
}

/** Route loading state for /add and /update: page header + the form placeholder. */
export default function FormSkeleton({ withSubtitle = false }: { withSubtitle?: boolean }) {
  return (
    <div className="page-container form-page" aria-busy="true" aria-label="Loading form">
      <div className="page-header page-header-page">
        <div className="page-header-text">
          <div className="skeleton skel-page-title" />
          {withSubtitle && <div className="skeleton skel-page-sub" />}
        </div>
      </div>
      <FormFieldsSkeleton />
    </div>
  );
}
