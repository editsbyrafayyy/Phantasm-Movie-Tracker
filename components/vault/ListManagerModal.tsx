'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Globe, Lock, Plus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

interface ListSummary {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  items?: { id: string; movie: { id: string } }[];
}

interface ListManagerModalProps {
  movieId?:    string;
  movieTitle?: string;
  onClose:     () => void;
  /** Feedback goes to the parent's toast so it survives the modal closing. */
  onNotify?:   (message: string, type: 'success' | 'error') => void;
}

/** Add/remove a film from the user's stacks, or create a new stack. Mount only while open. */
export default function ListManagerModal({ movieId, movieTitle, onClose, onNotify }: ListManagerModalProps) {
  const [lists, setLists]       = useState<ListSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc]   = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/lists', { signal: ctrl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load stacks (${res.status})`);
        return res.json();
      })
      .then((data: { lists?: ListSummary[] }) => setLists(data.lists ?? []))
      .catch(err => {
        if ((err as Error).name !== 'AbortError') setLoadError(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  async function handleCreateList(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          is_public: isPublic,
          movieIds: movieId ? [movieId] : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create stack');

      const newList: ListSummary = {
        ...data.list,
        items: movieId ? [{ id: `temp-${data.list?.id ?? newTitle}`, movie: { id: movieId } }] : [],
      };
      setLists(prev => [newList, ...prev]);
      setNewTitle('');
      setNewDesc('');
      setCreating(false);
      onNotify?.('Stack created', 'success');
    } catch (err: unknown) {
      onNotify?.(err instanceof Error ? err.message : 'Could not create stack', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleMovieInList(listId: string, isInList: boolean) {
    if (!movieId || pendingId) return;
    setPendingId(listId);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isInList ? { removeMovieId: movieId } : { addMovieId: movieId }),
      });
      if (!res.ok) throw new Error('Update failed');
      setLists(prev => prev.map(l => {
        if (l.id !== listId) return l;
        const items = l.items ?? [];
        return {
          ...l,
          items: isInList
            ? items.filter(item => item.movie?.id !== movieId)
            : [...items, { id: `temp-${movieId}`, movie: { id: movieId } }],
        };
      }));
      onNotify?.(isInList ? 'Removed from stack' : 'Added to stack', 'success');
    } catch {
      onNotify?.('Could not update stack', 'error');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Modal
      title={movieId ? 'Save to stack' : 'Your stacks'}
      onClose={onClose}
      size="sm"
      className="list-modal"
    >
      {movieTitle && <p className="list-modal-sub">{movieTitle}</p>}

      {creating ? (
        <form onSubmit={handleCreateList} className="list-create-form">
          <label className="form-label" htmlFor="stack-title">Stack name</label>
          <input
            id="stack-title"
            type="text"
            className="form-input"
            placeholder="e.g. 80s slasher classics"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
            data-autofocus
          />
          <label className="form-label" htmlFor="stack-desc">
            Description <span className="optional">(optional)</span>
          </label>
          <textarea
            id="stack-desc"
            className="form-input"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            rows={2}
          />
          <div className="list-form-footer">
            <label className="list-toggle-label">
              <input
                type="checkbox"
                className="list-checkbox-input"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              <span className="list-toggle-span">
                {isPublic ? <Globe size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
                <span>{isPublic ? 'Public' : 'Private'}</span>
              </span>
            </label>
            <div className="list-actions-group">
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary list-create-submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <button type="button" className="list-add-new-btn" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> New stack
          </button>

          {loading ? (
            <div className="list-modal-status" role="status"><Spinner /> Loading stacks…</div>
          ) : loadError ? (
            <p className="list-empty-text" role="alert">Could not load your stacks. Close and try again.</p>
          ) : lists.length === 0 ? (
            <p className="list-empty-text">No stacks yet. Create one to start grouping films.</p>
          ) : (
            <ul className="list-select-items">
              {lists.map(l => {
                const isInList = !!(movieId && l.items?.some(i => i.movie?.id === movieId));
                const count = l.items?.length ?? 0;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      className={`list-item-row${isInList ? ' selected' : ''}`}
                      onClick={() => toggleMovieInList(l.id, isInList)}
                      aria-pressed={movieId ? isInList : undefined}
                      disabled={!movieId || pendingId === l.id}
                    >
                      <span>
                        <span className="list-item-name">{l.title}</span>
                        <span className="list-item-sub">
                          {count} film{count === 1 ? '' : 's'} · {l.is_public ? 'Public' : 'Private'}
                        </span>
                      </span>
                      {movieId && (
                        <span className={`list-checkbox${isInList ? ' active' : ''}`} aria-hidden="true">
                          {isInList && <Check size={14} />}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
