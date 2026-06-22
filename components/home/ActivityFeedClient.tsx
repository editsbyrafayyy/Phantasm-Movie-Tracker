'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Film, ChevronDown, ChevronUp } from 'lucide-react';

export interface ActivityItem {
  id:           string;
  updated_at:   string;
  total:        number | null;
  recommend:    string | null;
  subgenre:     string;
  movie: {
    title:      string;
    poster_url: string | null;
    year:       number | null;
  };
  profile: {
    username:     string;
    display_name: string | null;
  };
  entry_id: string;
}

const RECOMMEND_STYLE: Record<string, { color: string }> = {
  Peak:    { color: '#9b59f5' },
  Yes:     { color: '#52b044' },
  No:      { color: '#e63232' },
  Garbage: { color: '#6b6b6b' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return `${weeks}w ago`;
}

export default function ActivityFeedClient({ items }: { items: ActivityItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  const displayItems = expanded ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <section className="activity-section" ref={sectionRef}>
      <div className="activity-header">
        <div className="activity-header-left">
          <span className="activity-eyebrow">Live</span>
          <h2 className="activity-title">Recent Activity</h2>
        </div>
        <span className="activity-pulse" aria-hidden="true" />
      </div>

      <div className="activity-feed">
        {displayItems.map(item => {
          const recStyle = item.recommend ? RECOMMEND_STYLE[item.recommend] : null;
          const displayName = item.profile.display_name ?? item.profile.username;
          const initial = displayName.charAt(0).toUpperCase();

          return (
            <Link key={item.id} href={`/vault/${item.id}`} className="activity-item">
              {/* Avatar */}
              <div className="activity-avatar" aria-label={displayName}>
                {initial}
              </div>

              {/* Poster thumb */}
              <div className="activity-poster">
                {item.movie.poster_url ? (
                  <Image
                    src={item.movie.poster_url}
                    alt={item.movie.title}
                    fill
                    sizes="44px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Film size={14} color="rgba(255,255,255,0.2)" />
                )}
              </div>

              {/* Text */}
              <div className="activity-text">
                <p className="activity-action">
                  <strong>{displayName}</strong>
                  {' rated '}
                  <em>{item.movie.title}</em>
                  {item.movie.year && <span className="activity-year"> ({item.movie.year})</span>}
                </p>
                <div className="activity-badges">
                  {item.total !== null && item.total > 0 && (
                    <span className="activity-score">{item.total}<small>/10</small></span>
                  )}
                  {item.recommend && recStyle && (
                    <span className="activity-recommend" style={{ color: recStyle.color }}>
                      {item.recommend}
                    </span>
                  )}
                  <span className="activity-subgenre">{item.subgenre}</span>
                </div>
              </div>

              {/* Time */}
              <span className="activity-time">{timeAgo(item.updated_at)}</span>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <button 
          className="activity-show-more"
          onClick={() => {
            if (expanded && sectionRef.current) {
              const top = sectionRef.current.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({ top: top - 80, behavior: 'smooth' });
            }
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <>Show Less <ChevronUp size={16} /></>
          ) : (
            <>Show More <ChevronDown size={16} /></>
          )}
        </button>
      )}
    </section>
  );
}
