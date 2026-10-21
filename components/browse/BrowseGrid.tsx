'use client';

import { useCallback, useId, useState } from 'react';
import Link from 'next/link';
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
}

export default function BrowseGrid({ canSave = false, isUnrestricted = false }: BrowseGridProps) {
  const pathname = usePathname();
  const genres = getGenreConfig(isUnrestricted);
  const feed = useBrowseFeed(genres.filterMap);
  const [moodOpen, setMoodOpen] = useState(false);
  const moodPanelId = useId();
  const closeMood = useCallback(() => setMoodOpen(false), []);

  // canSave doubles as "signed in": guests can browse but the player is members-only.
  // Always one line, so the route skeleton can reserve it.
  const subtitle = feed.genre
    ? genres.descriptions[feed.genre]
    : canSave
      ? genres.descriptions.All
      : <><Link href="/login?next=/stream" className="browse-signin-link">Sign in</Link> to play anything here.</>;

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
          title="Stream"
          eyebrow={feed.genre ?? undefined}
          subtitle={subtitle}
        />

        {canSave && <WatchHistoryRow />}

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
