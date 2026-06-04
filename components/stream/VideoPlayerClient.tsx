'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';

interface Props {
  sources:      { name: string; url: string }[];
  title:        string;
  type:         'movie' | 'tv';
  imdbId:       string;
  poster_url?:  string | null;
  plot?:        string | null;
  cast_list?:   { name: string; profile_path: string | null }[] | string[] | null;
  genre_tags?:  string[] | null;
  year?:        number | null;
  director?:    string | null;
  runtime_min?: number | null;
  imdb_rating?: number | null;
}

export default function VideoPlayerClient({
  sources,
  title,
  type,
  poster_url,
  plot,
  cast_list,
  genre_tags,
  year,
  director,
  runtime_min,
  imdb_rating,
}: Props) {
  const [sourceIdx, setSourceIdx] = useState(0);
  const failed = sources.length === 0;

  const current = sources[sourceIdx];

  // Parse cast_list — may be string objects or plain objects
  const castItems = (cast_list ?? []).slice(0, 6).map(c => {
    if (typeof c === 'string') {
      try { return JSON.parse(c) as { name: string; profile_path: string | null }; }
      catch { return { name: c, profile_path: null }; }
    }
    return c as { name: string; profile_path: string | null };
  });

  return (
    <div className="watch-page">
      {/* Header */}
      <div className="watch-header">
        <Link href="/stream" className="watch-back">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
        <span className="watch-header-title">{title}</span>
        <div style={{ width: 80 }} />
      </div>

      {/* Main layout */}
      <div className="watch-layout">
        {/* Player column */}
        <div className="watch-player-col">
          {/* 16:9 iframe */}
          <div className="watch-iframe-wrap">
            {failed ? (
              <div className="watch-unavailable">
                <p>Not available on any source right now.</p>
                <p>Try again later or check another service.</p>
                <Link href="/stream" className="btn-edit" style={{ marginTop: 16, display: 'inline-flex' }}>
                  Browse other films
                </Link>
              </div>
            ) : (
              <iframe
                key={current?.url}
                src={current?.url}
                className="watch-iframe"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                referrerPolicy="no-referrer"
                title={title}
              />
            )}
          </div>

          {/* Now Playing + server grid */}
          {!failed && (
            <div className="watch-controls">
              <div className="watch-now-playing">
                <span className="watch-now-label">Now Playing</span>
                <span className="watch-now-title">{title}</span>
              </div>
              <div className="watch-server-grid">
                {sources.map((src, i) => (
                  <button
                    key={src.name}
                    className={`watch-server-btn${i === sourceIdx ? ' active' : ''}`}
                    onClick={() => setSourceIdx(i)}
                  >
                    <span className="watch-server-dot" />
                    {src.name}
                  </button>
                ))}
              </div>
              <p className="watch-tip">If one server does not load, try another.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="watch-sidebar">
          {poster_url && (
            <div className="watch-poster">
              <Image src={poster_url} alt={title} fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
          )}

          <div className="watch-meta">
            <h2 className="watch-meta-title">{title}</h2>

            <div className="watch-meta-row">
              {imdb_rating && (
                <span className="watch-meta-badge">
                  <Star size={11} fill="currentColor" /> {imdb_rating}
                </span>
              )}
              {year && <span className="watch-meta-pill">{year}</span>}
              {type === 'tv' && <span className="watch-meta-pill">Series</span>}
              {runtime_min && (
                <span className="watch-meta-pill">{runtime_min} min</span>
              )}
            </div>

            {genre_tags && genre_tags.length > 0 && (
              <div className="watch-genre-tags">
                {genre_tags.map(g => (
                  <span key={g} className="watch-genre-tag">{g}</span>
                ))}
              </div>
            )}

            {plot && <p className="watch-plot">{plot}</p>}

            {director && (
              <div className="watch-detail-row">
                <span className="watch-detail-key">Director</span>
                <span className="watch-detail-val">{director}</span>
              </div>
            )}

            {castItems.length > 0 && (
              <div className="watch-cast">
                <p className="watch-cast-label">Cast</p>
                <div className="watch-cast-list">
                  {castItems.map((c, i) => (
                    <div key={i} className="watch-cast-item">
                      <div className="watch-cast-avatar">
                        {c.profile_path ? (
                          <Image
                            src={c.profile_path}
                            alt={c.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        ) : (
                          <span>{c.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="watch-cast-name">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
