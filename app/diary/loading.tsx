export default function DiaryLoading() {
  return (
    <div className="page-container diary-page" aria-busy="true" aria-label="Loading diary">
      <div className="page-header">
        <div className="page-header-text">
          <div className="skeleton skel-label" />
          <div className="skeleton skel-title" />
        </div>
      </div>

      <div className="list-toolbar">
        <div className="skeleton skel-input list-toolbar-search" />
        <div className="skel-pill-row">
          {[0, 1, 2].map(i => <div key={i} className="skeleton skel-chip" />)}
        </div>
      </div>

      <div className="diary-feed-list">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="diary-item-card">
            <div className="skeleton skel-line diary-item-date" />
            <div className="skeleton diary-item-poster" />
            <div className="diary-item-info">
              <div className="skeleton skel-line skel-line-name" />
              <div className="skeleton skel-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
