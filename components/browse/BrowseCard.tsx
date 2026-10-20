import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import WatchlistButton from '@/components/watchlist/WatchlistButton';
import type { TmdbDiscoverMovie } from '@/lib/tmdb';
import type { MediaType } from './useBrowseFeed';

const BLUR_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg==';

interface BrowseCardProps {
  movie:     TmdbDiscoverMovie;
  mediaType: MediaType;
  /** Current pathname — passed to the detail page as the back target. */
  from:      string;
  canSave:   boolean;
}

/**
 * Poster card for the discovery grid. The poster/title link and the quick
 * actions are siblings (no interactive elements nested inside the link).
 */
export default function BrowseCard({ movie, mediaType, from, canSave }: BrowseCardProps) {
  const title  = movie.title || movie.name || 'Untitled';
  const date   = movie.release_date || movie.first_air_date;
  const year   = date?.slice(0, 4);
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null;

  return (
    <article className="browse-card">
      <Link
        href={`/stream/tmdb/${movie.id}?type=${mediaType}&from=${encodeURIComponent(from)}`}
        className="browse-card-link"
      >
        <div className="browse-card-poster">
          {poster ? (
            <Image
              src={poster}
              alt=""
              fill
              className="browse-card-img"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 200px"
              placeholder="blur"
              blurDataURL={BLUR_PIXEL}
            />
          ) : (
            <div className="browse-card-fallback" aria-hidden="true">{title.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <p className="browse-card-title">{title}</p>
        <p className="browse-card-meta">
          {year ? `${year} · ` : ''}{mediaType === 'movie' ? 'Movie' : 'Series'}
        </p>
      </Link>

      {canSave && (
        <div className="browse-card-actions">
          <Link
            href={`/add?tmdbId=${movie.id}&title=${encodeURIComponent(title)}`}
            className="browse-card-action"
            aria-label={`Rate and add ${title} to your vault`}
            title="Rate & add to vault"
          >
            <Plus size={16} />
          </Link>
          <WatchlistButton
            tmdbId={movie.id}
            mediaType={mediaType}
            title={title}
            posterUrl={poster}
            year={Number(year) || null}
            showLabel={false}
            className="browse-card-action"
          />
        </div>
      )}
    </article>
  );
}
