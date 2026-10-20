'use client';

import { useCallback, useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import WatchHistoryRow from '@/components/stream/WatchHistoryRow';
import MoodPanel from './MoodPicker';
import GenreRail, { GenreChips } from './GenreRail';
import BrowseToolbar from './BrowseToolbar';
import BrowseResults from './BrowseResults';
import { getGenreConfig } from './browseGenres';
import { useBrowseFeed } from './useBrowseFeed';

interface BrowseGridProps {
  canSave?:        boolean;
  isUnrestricted?: boolean;
  /** 'browse' = public Discover page, 'stream' = members' streaming catalogue. */
  variant?:        'browse' | 'stream';
}

export default function BrowseGrid({ canSave = false, isUnrestricted = false, variant = 'browse' }: BrowseGridProps) {
  const pathname = usePathname();
  const genres = getGenreConfig(isUnrestricted);
  const feed = useBrowseFeed(genres.filterMap);
  const [moodOpen, setMoodOpen] = useState(false);
  const moodPanelId = useId();
  const closeMood = useCallback(() => setMoodOpen(false), []);

  const subtitle = feed.genre
    ? genres.descriptions[feed.genre]
    : variant === 'stream'
      ? 'Pick something, press play. Your unfinished titles wait up top.'
      : isUnrestricted
        ? 'Films and series across every genre, studio and decade.'
        : 'Explore the deepest corners of the horror catalogue.';

  const trimmedSearch = feed.searchQuery.trim();

  return (
    <div className="browse-layout">
      <GenreRail
        items={genres.items}
        descriptions={genres.descriptions}
        genre={feed.genre}
        onSelect={feed.selectGenre}
        isUnrestricted={isUnrestricted}
      />

      <div className="browse-container browse-container--inset">
        <PageHeader
          title={variant === 'stream' ? 'Stream' : 'Discover'}
          accent={variant === 'stream' ? undefined : isUnrestricted ? undefined : 'horror'}
          eyebrow={feed.genre ?? undefined}
          subtitle={subtitle}
        />

        <WatchHistoryRow />

        <GenreChips
          items={genres.items}
          genre={feed.genre}
          onSelect={feed.selectGenre}
          isUnrestricted={isUnrestricted}
        />

        <BrowseToolbar
          mediaType={feed.mediaType}
          onMediaType={feed.setMediaType}
          searchQuery={feed.searchQuery}
          onSearch={feed.setSearchQuery}
          onClearSearch={feed.clearSearch}
          isUnrestricted={isUnrestricted}
          moodOpen={moodOpen}
          onToggleMood={() => setMoodOpen(o => !o)}
          moodPanelId={moodPanelId}
        />
        <MoodPanel id={moodPanelId} open={moodOpen} onClose={closeMood} />

        <div className="browse-results-wrap">
          <BrowseResults
            movies={feed.movies}
            mediaType={feed.moviesType}
            from={pathname}
            canSave={canSave}
            page={feed.page}
            hasMore={feed.hasMore}
            error={feed.error}
            initialLoading={feed.initialLoading}
            swapping={feed.swapping}
            loadingMore={feed.loadingMore}
            isEmpty={feed.isEmpty}
            autoLoadCapped={feed.autoLoadCapped}
            filterLabel={trimmedSearch || feed.genre}
            onClearFilters={feed.clearFilters}
            onRetry={feed.retry}
            onLoadMore={feed.loadMore}
            sentinelRef={feed.sentinelRef}
          />
        </div>
      </div>
    </div>
  );
}
