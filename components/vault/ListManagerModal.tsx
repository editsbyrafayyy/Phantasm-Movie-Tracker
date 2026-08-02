'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, Layers, Lock, Globe } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface ListSummary {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  items?: { id: string; movie: { id: string } }[];
}

interface ListManagerModalProps {
  movieId?: string;
  movieTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ListManagerModal({ movieId, movieTitle, isOpen, onClose }: ListManagerModalProps) {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // New list form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/lists')
      .then(res => res.json())
      .then(data => {
        setLists(data.lists || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          is_public: isPublic,
          movieIds: movieId ? [movieId] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create list');

      setToast({ message: 'Stack created successfully!', type: 'success' });
      setLists(prev => [data.list, ...prev]);
      setNewTitle('');
      setNewDesc('');
      setCreating(false);
    } catch (err: any) {
      setToast({ message: err.message || 'Error creating stack', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleMovieInList(listId: string, isInList: boolean) {
    if (!movieId) return;

    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isInList
            ? { removeMovieId: movieId }
            : { addMovieId: movieId }
        ),
      });

      if (!res.ok) throw new Error('Update failed');

      setLists(prev => prev.map(l => {
        if (l.id !== listId) return l;
        const currentItems = l.items || [];
        const nextItems = isInList
          ? currentItems.filter(item => item.movie?.id !== movieId)
          : [...currentItems, { id: Date.now().toString(), movie: { id: movieId } }];
        return { ...l, items: nextItems };
      }));

      setToast({
        message: isInList ? 'Removed from stack' : 'Added to stack!',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update stack', type: 'error' });
    }
  }

  return (
    <div className="list-modal-backdrop" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      
      <div className="list-modal-container" onClick={e => e.stopPropagation()}>
        <div className="list-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={18} style={{ color: 'var(--red)' }} />
            <h3 className="list-modal-title">
              {movieId ? `Save "${movieTitle}" to Stack` : 'Custom Stacks'}
            </h3>
          </div>
          <button className="list-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="list-modal-body">
          {creating ? (
            <form onSubmit={handleCreateList} className="list-create-form">
              <input
                type="text"
                className="list-input"
                placeholder="Stack Title (e.g. 80s Slasher Classics)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                autoFocus
              />
              <textarea
                className="list-textarea"
                placeholder="Short description (optional)..."
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
                    {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    <span>{isPublic ? 'Public Stack' : 'Private Stack'}</span>
                  </span>
                </label>
                <div className="list-actions-group">
                  <button type="button" className="list-btn-secondary" onClick={() => setCreating(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="list-btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Stack'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <button className="list-add-new-btn" onClick={() => setCreating(true)}>
                <Plus size={16} /> Create New Stack
              </button>

              {loading ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  Loading your stacks...
                </div>
              ) : lists.length === 0 ? (
                <p className="list-empty-text">No custom stacks created yet.</p>
              ) : (
                <div className="list-select-items">
                  {lists.map(l => {
                    const isInList = !!(movieId && l.items?.some(i => i.movie?.id === movieId));
                    return (
                      <div
                        key={l.id}
                        className={`list-item-row${isInList ? ' selected' : ''}`}
                        onClick={() => movieId && toggleMovieInList(l.id, isInList)}
                      >
                        <div>
                          <p className="list-item-name">{l.title}</p>
                          <span className="list-item-sub">
                            {l.items?.length || 0} movies {l.is_public ? '· Public' : '· Private'}
                          </span>
                        </div>
                        {movieId && (
                          <div className={`list-checkbox${isInList ? ' active' : ''}`}>
                            {isInList && <Check size={14} color="white" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
