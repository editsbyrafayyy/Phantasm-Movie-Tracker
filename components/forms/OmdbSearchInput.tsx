'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image   from 'next/image';
import { Film } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import type { OmdbSearchHit } from '@/lib/types';

interface OmdbSearchInputProps {
  value:         string;
  onTitleChange: (title: string) => void;
  onSelect:      (hit: OmdbSearchHit) => void;
  disabled?:     boolean;
}

export default function OmdbSearchInput({
  value,
  onTitleChange,
  onSelect,
  disabled = false,
}: OmdbSearchInputProps) {
  const [results,  setResults]  = useState<OmdbSearchHit[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const [active,   setActive]   = useState(-1);  // keyboard nav index
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/omdb-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(data.length > 0);
      setActive(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    onTitleChange(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  }

  function handleSelect(hit: OmdbSearchHit) {
    onTitleChange(hit.title);
    onSelect(hit);
    setOpen(false);
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); handleSelect(results[active]); }
    if (e.key === 'Escape')    { setOpen(false); }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="omdb-wrap" ref={containerRef}>
      <div className="omdb-input-wrap">
        <input
          id="title"
          type="text"
          role="combobox"
          className="form-input"
          placeholder="Start typing a title…"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Movie title"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="omdb-dropdown"
          disabled={disabled}
        />
        {loading && (
          <Spinner size={14} className="omdb-spinner" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id="omdb-dropdown"
          className="omdb-dropdown"
          role="listbox"
          aria-label="Movie suggestions"
        >
          {results.map((hit, i) => (
            <li
              key={hit.imdbID}
              className={`omdb-item${active === i ? ' active' : ''}`}
              role="option"
              aria-selected={active === i}
              onMouseEnter={() => setActive(i)}
              onClick={() => handleSelect(hit)}
            >
              {/* Thumbnail */}
              <div className="omdb-thumb" aria-hidden="true">
                {hit.poster ? (
                  <Image
                    src={hit.poster}
                    alt=""
                    width={28}
                    height={40}
                    className="omdb-thumb-img"
                    unoptimized
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

          <li className="omdb-skip">
            <button
              type="button"
              className="omdb-skip-btn"
              onClick={() => { setOpen(false); setResults([]); }}
            >
              Skip — use typed title
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
