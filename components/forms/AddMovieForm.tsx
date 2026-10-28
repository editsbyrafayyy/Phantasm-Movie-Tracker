'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast, { type ToastType } from '@/components/ui/Toast';
import ScoreReveal from '@/components/ui/ScoreReveal';
import RatingFormFields, {
  FormSubmitBar, validateRatingForm, type RatingForm, type RatingErrors,
} from '@/components/forms/RatingFormFields';
import { computeTotal } from '@/lib/config';
import type { OmdbSearchHit } from '@/lib/types';

const EMPTY: RatingForm = {
  title:        '',
  omdbId:       '',
  subgenre:     '',
  secondaryTag: '',
  recommend:    '',
  atmosphere:   '',
  story:        '',
  characters:   '',
  pacing:       '',
  visuals:      '',
  thrill:       '',
  sound:        '',
  impact:       '',
  bonus:        0,
  notes:        '',
};

/**
 * Reads ?title / ?omdbId / ?tmdbId once and keys the form on them, so a new
 * prefill (e.g. "Log this film" from another page) resets the form cleanly.
 */
export default function AddMovieForm() {
  const searchParams = useSearchParams();
  const title  = searchParams.get('title') ?? '';
  const omdbId = searchParams.get('omdbId') ?? '';
  const tmdbId = searchParams.get('tmdbId') ?? '';
  // `type=tv` marks a series — TMDB movie and TV ids overlap.
  const tmdbTag = searchParams.get('type') === 'tv' ? 'tmdbtv' : 'tmdb';
  const ref    = omdbId || (tmdbId ? `${tmdbTag}:${tmdbId}` : '');
  return <AddMovieFormInner key={`${title}|${ref}`} initialTitle={title} initialRef={ref} />;
}

interface VaultTitle { id: string; title: string }

function AddMovieFormInner({ initialTitle, initialRef }: { initialTitle: string; initialRef: string }) {
  const router = useRouter();
  const [form, setForm] = useState<RatingForm>(() => ({ ...EMPTY, title: initialTitle, omdbId: initialRef }));
  // Title the current omdbId belongs to — editing away from it drops the match.
  const [matchedTitle, setMatchedTitle] = useState(initialRef ? initialTitle : '');
  const [loading,    setLoading]    = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [toast,      setToast]      = useState<{ message: string; type: ToastType } | null>(null);
  const [errors,     setErrors]     = useState<RatingErrors>({});
  const [vaultTitles, setVaultTitles] = useState<VaultTitle[]>([]);

  // Load the user's own titles once for the duplicate check
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/movies', { signal: controller.signal })
      .then(r => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        setVaultTitles(data.map((e: { id: string; movie?: { title?: string } | null }) => ({
          id: e.id,
          title: e.movie?.title?.toLowerCase().trim() ?? '',
        })));
      })
      .catch(() => { /* aborted or offline — duplicate check is best-effort */ });
    return () => controller.abort();
  }, []);

  const duplicate = useMemo(() => {
    const q = form.title.toLowerCase().trim();
    if (q.length < 3) return null;
    return vaultTitles.find(e => e.title === q) ?? null;
  }, [form.title, vaultTitles]);

  const total = computeTotal(form);

  function setField<K extends keyof RatingForm>(key: K, value: RatingForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handleTitleChange(title: string) {
    setForm(prev => ({
      ...prev,
      title,
      omdbId: prev.omdbId && title.trim() !== matchedTitle.trim() ? '' : prev.omdbId,
    }));
    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
  }

  function handleOmdbSelect(hit: OmdbSearchHit) {
    setMatchedTitle(hit.title);
    setForm(prev => ({ ...prev, title: hit.title, omdbId: hit.imdbID }));
    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validateRatingForm(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      document.getElementById(newErrors.title ? 'title' : 'subgenre')?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/add-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let errMessage = 'Could not add the film.';
        try {
          const err = await res.json();
          if (err.error) errMessage = err.error;
        } catch { /* use defaults */ }

        if (res.status === 409)      errMessage = 'This film is already in your vault.';
        else if (res.status === 429) errMessage = 'Too many requests. Wait a moment and try again.';
        else if (res.status === 401) errMessage = 'Your session has expired. Sign in again.';
        setToast({ message: errMessage, type: 'error' });
        setLoading(false);
        return;
      }
      if (total > 0) {
        setShowReveal(true);
      } else {
        setToast({ message: `"${form.title}" added to your vault.`, type: 'success' });
        setTimeout(() => router.push('/vault'), 900);
      }
    } catch {
      setToast({ message: 'Network error. Check your connection and try again.', type: 'error' });
      setLoading(false);
    }
  }

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
        titleExtra={duplicate && (
          <div className="form-notice" role="status">
            <span>Already in your vault — &ldquo;{form.title.trim()}&rdquo; is logged.</span>
            <Link href={`/vault/${duplicate.id}`} className="form-notice-link">View entry</Link>
          </div>
        )}
      />

      <FormSubmitBar total={total} loading={loading} label="Add to vault" />

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      {showReveal && (
        <ScoreReveal
          total={total}
          title={form.title}
          recommend={form.recommend}
          onDone={() => router.push('/vault')}
        />
      )}
    </form>
  );
}
