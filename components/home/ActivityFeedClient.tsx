'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { gridPosterUrl } from '@/components/vault/posterSrc';
import Link from 'next/link';
import { Film, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

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
  /** Detail link, or null when the viewer can't open this member's entry. */
  href:          string | null;
  /** Relative time, computed on the server. */
  timeLabel:     string;
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

export default function ActivityFeedClient({ items }: { items: ActivityItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  const displayItems = expanded ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <section className="activity-section" ref={sectionRef}>
      <PageHeader as="section" title="Recent" accent="activity" subtitle="What my friends and I have been logging lately." />

      <div className="activity-feed">
        {displayItems.map(item => {
          const recStyle = item.recommend ? RECOMMEND_STYLE[item.recommend] : null;
          const displayName = item.profile?.display_name?.trim() || item.profile?.username || 'Member';
          const initial = (Array.from(displayName)[0] || 'M').toUpperCase();
          const action = getActivityAction(item);

          const body = (
            <>
              {/* Avatar */}
              <div className="activity-avatar" aria-hidden="true">
                {item.profile?.avatar_url ? (
                  <Image
                    src={item.profile.avatar_url}
                    alt=""
                    fill
                    sizes="34px"
                    className="activity-avatar-img"
                  />
                ) : (
                  initial
                )}
              </div>

              {/* Poster thumb */}
              <div className="activity-poster">
                {item.movie.poster_url ? (
                  <Image
                    src={gridPosterUrl(item.movie.poster_url)!}
                    alt=""
                    fill
                    sizes="44px"
                    className="activity-poster-img"
                  />
                ) : (
                  <Film size={14} aria-hidden="true" />
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
                    <span className="activity-badge-must-watch">Must watch</span>
                  )}
                  {item.total !== null && item.total !== undefined && item.total > 0 && (
                    <span className="activity-score">{item.total}<small>/10</small></span>
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
                    <span className="activity-badge-notes">Review</span>
                  )}
                </div>
              </div>

              {/* Time */}
              <span className="activity-time">{item.timeLabel}</span>
            </>
          );

          return item.href ? (
            <Link key={item.id} href={item.href} className="activity-item">{body}</Link>
          ) : (
            <div key={item.id} className="activity-item is-static">{body}</div>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          aria-expanded={expanded}
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
            <>Show less <ChevronUp size={16} aria-hidden="true" /></>
          ) : (
            <>Show more <ChevronDown size={16} aria-hidden="true" /></>
          )}
        </button>
      )}
    </section>
  );
}
