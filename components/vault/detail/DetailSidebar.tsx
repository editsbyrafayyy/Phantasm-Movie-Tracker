import { RotateCcw } from 'lucide-react';
import type { Entry } from '@/lib/types';
import { VERDICT_LABEL, verdictColor } from '../verdict';

interface DetailSidebarProps {
  entry:      Entry;
  watchCount: number;
  canLog:     boolean;
  onLogWatch: () => void;
}

/** Score card + film facts. */
export default function DetailSidebar({ entry, watchCount, canLog, onLogWatch }: DetailSidebarProps) {
  const { movie } = entry;
  const hasScore = entry.total !== null && entry.total > 0;
  const recColor = verdictColor(entry.recommend);
  const watchText = watchCount > 0 ? `${watchCount} ${watchCount === 1 ? 'watch' : 'watches'}` : 'Not logged';

  return (
    <aside className="detail-overview-side">
      <div className="vault-score-card">
        <span className="vault-score-label">Vault score</span>
        {hasScore ? (
          <div className="vault-score-figure">
            <span className="vault-score-value">{entry.total}</span>
            <span className="vault-score-denom">/10</span>
          </div>
        ) : (
          <p className="vault-score-empty">Not scored yet</p>
        )}
        {entry.recommend && recColor && (
          <span className="verdict-badge" style={{ '--verdict': recColor } as React.CSSProperties}>
            <span className="vault-dot" aria-hidden="true" />
            {VERDICT_LABEL[entry.recommend] ?? entry.recommend}
          </span>
        )}
      </div>

      <dl className="vault-meta-card">
        <div className="vault-meta-row"><dt>Year</dt><dd>{movie.year ?? '—'}</dd></div>
        <div className="vault-meta-row"><dt>Runtime</dt><dd>{movie.runtime_min ? `${movie.runtime_min} min` : '—'}</dd></div>
        <div className="vault-meta-row"><dt>Director</dt><dd>{movie.director ?? '—'}</dd></div>
        <div className="vault-meta-row"><dt>IMDb</dt><dd>{movie.imdb_rating ?? '—'}</dd></div>
        {canLog && (
          <div className="vault-meta-row">
            <dt>Watch log</dt>
            <dd>
              <button
                type="button"
                className={`vault-meta-log${watchCount > 1 ? ' is-rewatched' : ''}`}
                onClick={onLogWatch}
                title="Log a watch"
              >
                {watchCount > 1 && <RotateCcw size={14} aria-hidden="true" />}
                {watchText}
              </button>
            </dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
