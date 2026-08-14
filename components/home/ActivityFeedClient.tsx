'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Film, ChevronDown, ChevronUp, MessageSquare, Bookmark } from 'lucide-react';

export interface ActivityItem {
  id:            string;
  created_at?:   string;
  updated_at:    string;
  total:         number | null;
  recommend:     string | null;
  subgenre:      string | null;
  secondary_tag?: string | null;
  must_watch?:   boolean;
  notes?:        string | null;
  user_id?:      string;
  movie: {
    title:       string;
    poster_url:  string | null;
    year:        number | null;
  };
  profile: {
    username:     string;
    display_name: string | null;
    avatar_url?:  string | null;
  };
}

const RECOMMEND_STYLE: Record<string, { color: string }> = {
  Peak:    { color: '#b785ff' },
  Yes:     { color: '#6ee35d' },
  No:      { color: '#ff5252' },
  Garbage: { color: '#888888' },
};

function getActivityAction(item: ActivityItem): { verb: string; isMustWatchAction?: boolean } {
  const isUpdate = Boolean(
    item.created_at &&
    item.updated_at &&
    new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 300000 // > 5 min delta
  );

  // If marked must_watch without a rating score
  if (item.must_watch && (item.total === null || item.total === undefined || item.total === 0)) {
    return { verb: 'added', isMustWatchAction: true };
  }

  // If personal review notes present
  if (item.notes && item.notes.trim().length > 0) {
    if (item.total !== null && item.total !== undefined && item.total > 0) {
      return { verb: isUpdate ? 'updated review & rating for' : 'reviewed & rated' };
    }
    return { verb: isUpdate ? 'updated review for' : 'reviewed' };
  }

  // If numeric rating score is present
  if (item.total !== null && item.total !== undefined && item.total > 0) {
    return { verb: isUpdate ? 'updated rating for' : 'rated' };
  }

  // Unrated / generic log
  return { verb: isUpdate ? 'updated' : 'logged' };
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return '';

  const diffMs = Date.now() - timestamp;
  if (diffMs < 45000) return 'just now'; // under 45s

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diffMs / 86400000);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
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
          const displayName = item.profile?.display_name?.trim() || item.profile?.username || 'Member';
          const initial = (Array.from(displayName)[0] || 'M').toUpperCase();
          const action = getActivityAction(item);

          return (
            <Link key={item.id} href={`/vault/${item.id}`} className="activity-item">
              {/* Avatar */}
              <div className="activity-avatar" aria-label={displayName}>
                {item.profile?.avatar_url ? (
                  <Image
                    src={item.profile.avatar_url}
                    alt={displayName}
                    fill
                    sizes="36px"
                    style={{ objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  initial
                )}
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
                  {` ${action.verb} `}
                  <em>{item.movie.title}</em>
                  {action.isMustWatchAction && <span className="activity-must-watch-target"> to Must Watch</span>}
                  {item.movie.year && <span className="activity-year"> ({item.movie.year})</span>}
                </p>
                <div className="activity-badges">
                  {item.must_watch && (
                    <span className="activity-badge-must-watch">
                      ★ Must Watch
                    </span>
                  )}
                  {item.total !== null && item.total !== undefined && item.total > 0 && (
                    <span className="activity-score">{item.total}<small>/11</small></span>
                  )}
                  {item.recommend && recStyle && (
                    <span className="activity-recommend" style={{ color: recStyle.color }}>
                      {item.recommend}
                    </span>
                  )}
                  {item.subgenre && (
                    <span className="activity-subgenre">{item.subgenre}</span>
                  )}
                  {item.notes && item.notes.trim().length > 0 && (
                    <span className="activity-badge-notes">
                      <MessageSquare size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                      Review
                    </span>
                  )}
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
