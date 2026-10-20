'use client';

import { useState, useRef, useEffect } from 'react';
import Image   from 'next/image';
import { Film } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import type { OmdbSearchHit } from '@/lib/types';

interface OmdbSearchInputProps {
  value:         string;
  onTitleChange: (title: string) => void;
  /** Called when a suggestion is picked. The parent owns the title + id. */
  onSelect:      (hit: OmdbSearchHit) => void;
  disabled?:     boolean;
  id?:           string;
  invalid?:      boolean;
  describedBy?:  string;
}

const LISTBOX_ID = 'omdb-dropdown';

export default function OmdbSearchInput({
  value,
  onTitleChange,
  onSelect,
  disabled = false,
  id = 'title',
  invalid = false,
  describedBy,
}: OmdbSearchInputProps) {
  const [results, setResults] = useState<OmdbSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [active,  setActive]  = useState(-1);  // keyboard nav index
  const [notice,  setNotice]  = useState<string | null>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef      = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    const activeEl = listRef.current.children[active] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // Cancel pending work on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function cancelPending() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
  }

  async function search(q: string) {
    cancelPending();
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setNotice(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/omdb-search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (!res.ok) {
        setResults([]);
        setOpen(false);
        setNotice(res.status === 429
          ? 'Search is rate-limited for a moment — you can keep the typed title.'
          : 'Search is unavailable right now — you can keep the typed title.');
        return;
      }
      const data: unknown = await res.json();
      if (controller.signal.aborted) return;
      const hits = Array.isArray(data) ? (data as OmdbSearchHit[]) : [];
      setResults(hits);
      setOpen(hits.length > 0);
      setActive(-1);
      setNotice(null);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setResults([]);
      setOpen(false);
      setNotice('Search failed — check your connection.');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;

    // Paste-a-link: IMDb URL (imdb.com/title/tt…) or a bare tt-ID
    const imdbMatch = q.match(/tt\d{7,8}/i);
    if (imdbMatch) {
      const imdbId = imdbMatch[0];
      onTitleChange(q.startsWith('http') ? imdbId : q);
      search(imdbId);
      return;
    }

    // Paste-a-link: TMDB URL (themoviedb.org/movie/123 or /tv/123)
    const tmdbMatch = q.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
    if (tmdbMatch) {
      const ref = `tmdb:${tmdbMatch[2]}`;
      onTitleChange(ref);
      search(ref);
      return;
    }

    onTitleChange(q);
    cancelPending();
    debounceRef.current = setTimeout(() => search(q), 350);
  }

  function handleSelect(hit: OmdbSearchHit) {
    cancelPending();
    onSelect(hit);
    setOpen(false);
    setResults([]);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); handleSelect(results[active]); }
    if (e.key === 'Escape')    { e.preventDefault(); setOpen(false); }
  }

  const noticeId = `${id}-search-notice`;
  const describedByIds = [describedBy, notice ? noticeId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="omdb-wrap" ref={containerRef}>
      <div className="omdb-input-wrap">
        <input
          id={id}
          type="text"
          role="combobox"
          className="field-input"
          placeholder="Start typing a title or paste an IMDb link…"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={LISTBOX_ID}
          aria-activedescendant={open && active >= 0 ? `omdb-option-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedByIds}
          disabled={disabled}
        />
        {loading && <Spinner size={14} className="omdb-spinner" />}
      </div>

      {notice && <p id={noticeId} className="field-hint">{notice}</p>}

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          id={LISTBOX_ID}
          className="omdb-dropdown"
          role="listbox"
          aria-label="Film suggestions"
        >
          {results.map((hit, i) => (
            <li
              key={hit.imdbID}
              id={`omdb-option-${i}`}
              className={`omdb-item${active === i ? ' active' : ''}`}
              role="option"
              aria-selected={active === i}
              onMouseEnter={() => setActive(i)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(hit)}
            >
              <div className="omdb-thumb" aria-hidden="true">
                {hit.poster ? (
                  <Image
                    src={hit.poster}
                    alt=""
                    width={28}
                    height={40}
                    className="omdb-thumb-img"
                  />
                ) : (
                  <div className="omdb-thumb-fallback">
                    <Film size={14} aria-hidden="true" />
                  </div>
                )}
              </div>

              <span className="omdb-item-title">{hit.title}</span>
              <span className="omdb-item-year">{hit.year}</span>
            </li>
          ))}

          <li className="omdb-skip" role="presentation">
            <button
              type="button"
              className="omdb-skip-btn"
              onClick={() => { setOpen(false); setResults([]); }}
            >
              Skip — use the typed title
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
