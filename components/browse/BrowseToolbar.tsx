'use client';

import { Search, X } from 'lucide-react';
import { MoodPickerTrigger } from './MoodPicker';
import type { MediaType } from './useBrowseFeed';

interface BrowseToolbarProps {
  mediaType:      MediaType;
  onMediaType:    (type: MediaType) => void;
  searchQuery:    string;
  onSearch:       (value: string) => void;
  onClearSearch:  () => void;
  isUnrestricted: boolean;
  moodOpen:       boolean;
  onToggleMood:   () => void;
  moodPanelId:    string;
}

const TYPES: { value: MediaType; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv',    label: 'Series' },
];

export default function BrowseToolbar({
  mediaType, onMediaType, searchQuery, onSearch, onClearSearch,
  isUnrestricted, moodOpen, onToggleMood, moodPanelId,
}: BrowseToolbarProps) {
  const placeholder = isUnrestricted
    ? (mediaType === 'movie' ? 'Search movies & anime' : 'Search series & anime')
    : (mediaType === 'movie' ? 'Search horror & thriller movies' : 'Search horror & thriller series');

  // Roving arrow-key support for the radio group.
  const onSegmentKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next = mediaType === 'movie' ? 'tv' : 'movie';
    onMediaType(next);
    const btn = e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`);
    btn?.focus();
  };

  return (
    <div className="browse-toolbar">
      <div
        className="browse-segmented"
        role="radiogroup"
        aria-label="Media type"
        onKeyDown={onSegmentKey}
        style={{ '--seg-index': TYPES.findIndex(t => t.value === mediaType) } as React.CSSProperties}
      >
        <span className="browse-segment-pill" aria-hidden="true" />
        {TYPES.map(t => {
          const checked = mediaType === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              data-value={t.value}
              className={`browse-segment${checked ? ' is-active' : ''}`}
              onClick={() => onMediaType(t.value)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="browse-search">
        <Search size={16} className="browse-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="field-input browse-search-input"
          placeholder={placeholder}
          aria-label={placeholder}
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape' && searchQuery) { e.preventDefault(); onClearSearch(); } }}
          enterKeyHint="search"
          autoComplete="off"
        />
        {searchQuery && (
          <button type="button" className="icon-btn browse-search-clear" onClick={onClearSearch} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      <MoodPickerTrigger open={moodOpen} onToggle={onToggleMood} controlsId={moodPanelId} />
    </div>
  );
}
