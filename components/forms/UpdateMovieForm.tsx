'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast, { type ToastType } from '@/components/ui/Toast';
import Spinner        from '@/components/ui/Spinner';
import ScoreReveal    from '@/components/ui/ScoreReveal';
import RatingFormFields, {
  FormSubmitBar, validateRatingForm, type RatingForm, type RatingErrors,
} from '@/components/forms/RatingFormFields';
import { SCORE_FIELDS, computeTotal } from '@/lib/config';
import type { Entry, OmdbSearchHit } from '@/lib/types';

type ScoreSnapshot = Pick<RatingForm, typeof SCORE_FIELDS[number]['key'] | 'bonus'>;
type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const draftKey = (id: string) => `vault_draft_note_${id}`;

function readDraft(id: string): string | null {
  try { return localStorage.getItem(draftKey(id)); } catch { return null; }
}
function writeDraft(id: string, value: string) {
  try {
    if (value) localStorage.setItem(draftKey(id), value);
    else localStorage.removeItem(draftKey(id));
  } catch { /* storage unavailable */ }
}

export default function UpdateMovieForm() {
  const searchParams = useSearchParams();
  const entryId = searchParams.get('id') ?? '';

  if (!entryId) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">No film selected</p>
        <p className="empty-state-body">Open a film in your vault and choose Edit to change its rating.</p>
        <Link href="/vault" className="btn-primary">Go to vault</Link>
      </div>
    );
  }

  return <UpdateMovieFormInner key={entryId} entryId={entryId} />;
}

function UpdateMovieFormInner({ entryId }: { entryId: string }) {
  const router = useRouter();

  const [status,     setStatus]     = useState<LoadState>('loading');
  const [form,       setForm]       = useState<RatingForm | null>(null);
  const [matchedTitle, setMatchedTitle] = useState('');
  const [prevTotal,  setPrevTotal]  = useState<number | null>(null);
  const [prevScores, setPrevScores] = useState<ScoreSnapshot | null>(null);
  const [myEntries,  setMyEntries]  = useState<Pick<Entry, 'id' | 'subgenre' | 'total'>[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [toast,      setToast]      = useState<{ message: string; type: ToastType } | null>(null);
  const [errors,     setErrors]     = useState<RatingErrors>({});

  // Load the entry being edited
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/movies/${entryId}`, { signal: controller.signal })
      .then(async r => {
        if (r.status === 404) { setStatus('not-found'); return; }
        if (!r.ok) { setStatus('error'); return; }
        const data: Entry = await r.json();
        const scores: ScoreSnapshot = {
          atmosphere: data.atmosphere ?? '',
          story:      data.story      ?? '',
          characters: data.characters ?? '',
          pacing:     data.pacing     ?? '',
          visuals:    data.visuals    ?? '',
          thrill:     data.thrill     ?? '',
          sound:      data.sound      ?? '',
          impact:     data.impact     ?? '',
          bonus:      data.bonus      ?? 0,
        };
        const title = data.movie?.title ?? '';
        setPrevTotal(data.total ?? null);
        setPrevScores(scores);
        setMatchedTitle(title);
        setForm({
          ...scores,
          title,
          omdbId:       data.movie?.omdb_id ?? '',
          subgenre:     data.subgenre      ?? '',
          secondaryTag: data.secondary_tag ?? '',
          recommend:    data.recommend     ?? '',
          notes:        readDraft(entryId) ?? data.notes ?? '',
        });
        setStatus('ready');
      })
      .catch(err => {
        if ((err as Error)?.name !== 'AbortError') setStatus('error');
      });
    return () => controller.abort();
  }, [entryId]);

  // The current user's own entries — for the "your average" hint
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/movies', { signal: controller.signal })
      .then(r => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setMyEntries(data as Entry[]);
      })
      .catch(() => { /* hint is optional */ });
    return () => controller.abort();
  }, []);

  const subgenre = form?.subgenre ?? '';
  const subgenreAvg = useMemo(() => {
    if (!subgenre) return null;
    const matches = myEntries.filter(
      e => e.id !== entryId && e.subgenre === subgenre && e.total !== null && e.total > 0,
    );
    if (!matches.length) return null;
    const sum = matches.reduce((acc, e) => acc + (e.total ?? 0), 0);
    return { avg: Math.round((sum / matches.length) * 10) / 10, count: matches.length };
  }, [myEntries, subgenre, entryId]);

  function setField<K extends keyof RatingForm>(key: K, value: RatingForm[K]) {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));
    if (key === 'notes') writeDraft(entryId, String(value));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handleTitleChange(title: string) {
    setForm(prev => prev ? {
      ...prev,
      title,
      omdbId: prev.omdbId && title.trim() !== matchedTitle.trim() ? '' : prev.omdbId,
    } : prev);
    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
  }

  function handleOmdbSelect(hit: OmdbSearchHit) {
    setMatchedTitle(hit.title);
    setForm(prev => (prev ? { ...prev, title: hit.title, omdbId: hit.imdbID } : prev));
    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const newErrors = validateRatingForm(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      document.getElementById(newErrors.title ? 'title' : 'subgenre')?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/movies/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        let message = 'Update failed.';
        try {
          const data = await res.json();
          if (data.error) message = data.error;
        } catch { /* keep default */ }
        setToast({ message, type: 'error' });
        setLoading(false);
        return;
      }

      writeDraft(entryId, '');
      if (computeTotal(form) > 0) setShowReveal(true);
      else router.push(`/vault/${entryId}`);
    } catch {
      setToast({ message: 'Network error. Try again.', type: 'error' });
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return <div className="form-loading" role="status"><Spinner size={24} /> Loading entry…</div>;
  }

  if (status !== 'ready' || !form) {
    const notFound = status === 'not-found';
    return (
      <div className="empty-state">
        <p className="empty-state-title">{notFound ? 'Entry not found' : 'Could not load entry'}</p>
        <p className="empty-state-body">
          {notFound
            ? 'This rating does not exist or belongs to someone else.'
            : 'Something went wrong loading this rating. Try again in a moment.'}
        </p>
        <Link href="/vault" className="btn-primary">Back to vault</Link>
      </div>
    );
  }

  const total = computeTotal(form);
  const canRestore = prevScores !== null && prevTotal !== null && total !== prevTotal;

  return (
    <form onSubmit={handleSubmit} className="movie-form" noValidate>
      <RatingFormFields
        form={form}
        errors={errors}
        disabled={loading}
        onField={setField}
        onTitleChange={handleTitleChange}
        onOmdbSelect={handleOmdbSelect}
        onClearMatch={() => { setMatchedTitle(''); setField('omdbId', ''); }}
        subgenreExtra={subgenreAvg && (
          <p className="field-hint">
            Your average for this subgenre: <strong>{subgenreAvg.avg}/10</strong> across {subgenreAvg.count} film{subgenreAvg.count === 1 ? '' : 's'}
          </p>
        )}
      />

      <FormSubmitBar total={total} loading={loading} label="Save changes">
        {canRestore && (
          <button
            type="button"
            className="link-btn form-restore-btn"
            onClick={() => setForm(prev => (prev ? { ...prev, ...prevScores } : prev))}
            disabled={loading}
          >
            Restore previous scores ({prevTotal}/10)
          </button>
        )}
      </FormSubmitBar>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      {showReveal && (
        <ScoreReveal
          total={total}
          title={form.title}
          recommend={form.recommend}
          isUpdate
          onDone={() => router.push(`/vault/${entryId}`)}
        />
      )}
    </form>
  );
}
