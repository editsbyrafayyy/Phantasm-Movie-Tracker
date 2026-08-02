'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, 
  Play, 
  Plus, 
  Download, 
  X,
  ExternalLink,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface CastMember {
  name: string;
  character?: string | null;
  profile_path: string | null;
}

interface ServerSource {
  id: string;
  name: string;
  url: string;
}

interface Props {
  sources:      ServerSource[];
  title:        string;
  type:         'movie' | 'tv';
  imdbId:       string;
  tmdbId?:      string | null;
  poster_url?:  string | null;
  backdrop_url?: string | null;
  plot?:        string | null;
  cast_list?:   CastMember[] | string[] | null;
  genre_tags?:  string[] | null;
  year?:        number | null;
  director?:    string | null;
  runtime_min?: number | null;
  imdb_rating?: number | null;
  status?:      string;
  production?:  string;
  aired?:       string;
  trailerKey?:  string;
  playlist:     string[]; // array of movie IDs in this slideshow
  currentId:    string;
  season?:      number;
  episode?:     number;
  seasons?: {
    air_date?: string;
    episode_count?: number;
    id: number;
    name: string;
    overview?: string;
    poster_path?: string | null;
    season_number: number;
    vote_average?: number;
  }[];
}

// Maps server identifiers or indices to flags, display labels, and sparkles
const SERVER_META: Record<string, { flag: string; sparkles?: boolean }> = {
  'vidlink-pro': { flag: '🇺🇸', sparkles: true },
  'vidsrc-to':   { flag: '🇺🇸' },
  'vidsrc-me':   { flag: '🇺🇸', sparkles: true },
  'vidsrc-pm':   { flag: '🇺🇸' },
  '2embed':      { flag: '🇺🇸' },
  'multiembed':  { flag: '🇺🇸', sparkles: true },
  'vidsrc-cc':   { flag: '🇬🇧' },
};

export default function VideoPlayerClient({
  sources,
  title,
  type,
  imdbId,
  tmdbId,
  poster_url,
  plot,
  cast_list,
  genre_tags,
  year,
  imdb_rating,
  runtime_min,
  status = 'Released',
  production = '',
  aired = '',
  trailerKey = '',
  playlist = [],
  currentId,
  season = 1,
  episode = 1,
  seasons = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [sourceIdx, setSourceIdx] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen event listeners
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    document.addEventListener('mozfullscreenchange', handler);
    document.addEventListener('msfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
      document.removeEventListener('mozfullscreenchange', handler);
      document.removeEventListener('msfullscreenchange', handler);
    };
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = playerContainerRef.current;
      if (!el) return;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        (el as any).mozRequestFullScreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }

  // TV tabbed interface state
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'reviews'>('episodes');
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [activeSeason, setActiveSeason] = useState(season);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>({});
  const [showFallback, setShowFallback] = useState(false);

  // Fallback timer for server sources
  useEffect(() => {
    setShowFallback(false);
    const t = setTimeout(() => setShowFallback(true), 4000);
    return () => clearTimeout(t);
  }, [sourceIdx, showTrailer]);

  // Sync activeSeason when season prop changes (e.g. on URL navigation)
  useEffect(() => {
    setActiveSeason(season);
  }, [season]);

  // Fetch episodes for the active season
  useEffect(() => {
    if (type !== 'tv' || !tmdbId) return;
    setEpisodesLoading(true);
    fetch(`/api/tmdb/tv/${tmdbId}/season/${activeSeason}`)
      .then(res => res.json())
      .then(data => {
        setEpisodes(data.episodes || []);
        setEpisodesLoading(false);
      })
      .catch(err => {
        console.error(err);
        setEpisodesLoading(false);
      });
  }, [tmdbId, activeSeason, type]);

  // Load watched state from localStorage on mount/id change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`watched:${tmdbId || imdbId}`);
      if (stored) {
        try {
          setWatchedEpisodes(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        setWatchedEpisodes({});
      }
    }
  }, [tmdbId, imdbId]);

  // Write to watch history on mount so the Stream Hub can surface "Pick up where you left off"
  useEffect(() => {
    if (typeof window === 'undefined' || !title) return;
    const HISTORY_KEY = 'vault_watch_history';
    const MAX_ITEMS   = 20;
    const TTL_MS      = 30 * 24 * 60 * 60 * 1000; // 30 days
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const existing: Array<{ id: string; title: string; poster_url: string | null; type: string; watchedAt: number }> =
        raw ? JSON.parse(raw) : [];
      // Remove stale (>30d) and the current id if already present
      const now = Date.now();
      const filtered = existing.filter(
        e => (now - e.watchedAt) < TTL_MS && e.id !== (tmdbId || imdbId)
      );
      const next = [
        { id: tmdbId || imdbId, title, poster_url: poster_url ?? null, type, watchedAt: now },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch { /* silent — never break the player */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imdbId, tmdbId]); // only re-run if the movie changes

  const toggleWatched = (s: number, epNum: number) => {
    const key = `${s}:${epNum}`;
    const newWatched = { ...watchedEpisodes, [key]: !watchedEpisodes[key] };
    setWatchedEpisodes(newWatched);
    localStorage.setItem(`watched:${tmdbId || imdbId}`, JSON.stringify(newWatched));
  };

  const seasonEpisodesCount = episodes.length;
  const watchedInSeasonCount = episodes.filter(ep => watchedEpisodes[`${activeSeason}:${ep.episode_number}`]).length;
  const watchedPercentage = seasonEpisodesCount > 0 ? Math.round((watchedInSeasonCount / seasonEpisodesCount) * 100) : 0;
  const isAllWatched = seasonEpisodesCount > 0 && episodes.every(ep => watchedEpisodes[`${activeSeason}:${ep.episode_number}`]);

  const toggleSelectAll = () => {
    const newWatched = { ...watchedEpisodes };
    episodes.forEach(ep => {
      newWatched[`${activeSeason}:${ep.episode_number}`] = !isAllWatched;
    });
    setWatchedEpisodes(newWatched);
    localStorage.setItem(`watched:${tmdbId || imdbId}`, JSON.stringify(newWatched));
  };

  const failed = sources.length === 0;
  const currentSource = sources[sourceIdx];

  // Resolve active URL
  const embedUrl = currentSource?.url ?? '';

  // Parse playlist positions
  const currentIdx = playlist.indexOf(currentId);
  const prevId = currentIdx > 0 ? playlist[currentIdx - 1] : null;

  // Parse cast members safely
  const castItems = (cast_list ?? []).slice(0, 8).map(c => {
    if (typeof c === 'string') {
      try { return JSON.parse(c) as CastMember; }
      catch { return { name: c, profile_path: null } as CastMember; }
    }
    return c as CastMember;
  });

  return (
    <div className="watch-page">
      {/* Main layout grid */}
      <div className="watch-layout">
        
        {/* Left Column: Player & Sources */}
        <div className="watch-player-col" style={{ padding: '24px' }}>
          
          {/* Header Row above player */}
          <div className="watch-back-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Link href="/stream" className="watch-back-btn" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', textDecoration: 'none', gap: 4, fontSize: 18, fontWeight: 600 }}>
              <ChevronLeft size={24} />
              <span>{title}</span>
            </Link>
          </div>

          {/* 16:9 Video Player Wrap */}
          <div 
            ref={playerContainerRef}
            className="watch-iframe-container" 
            style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            
            {/* Playlist Nav Chevrons */}
            {prevId && (
              <button 
                onClick={() => { setShowTrailer(false); router.push(`/stream/${prevId}`); }}
                className="watch-nav-btn left"
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }}
                aria-label="Previous movie"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Video Iframe */}
            {failed ? (
              <div className="watch-unavailable" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <p>No streams are available for this title right now.</p>
              </div>
            ) : (
              <iframe
                key={showTrailer ? `trailer-${trailerKey}` : embedUrl}
                src={showTrailer ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1` : embedUrl}
                className="watch-iframe"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
                allowFullScreen
                referrerPolicy="origin"
                title={title}
              />
            )}

            {/* Trailer overlay header */}
            {showTrailer && (
              <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.85)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.15)', zIndex: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>NOW PLAYING: Official Trailer</span>
                <button 
                  onClick={() => setShowTrailer(false)} 
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  aria-label="Close trailer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Under player controls */}
          <div className="watch-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
            
            {/* Buttons: Add, Download */}
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Add to Vault */}
              <Link 
                href={imdbId ? `/add?omdbId=${imdbId}&title=${encodeURIComponent(title)}` : `/add?tmdbId=${tmdbId || ''}&title=${encodeURIComponent(title)}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', textDecoration: 'none' }}
                title="Add to Vault"
              >
                <Plus size={18} />
              </Link>

              {/* Download */}
              <button 
                onClick={() => setShowDownloadModal(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}
                title="Download options"
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* Warning banner callout */}
          <div className="watch-warning-banner" style={{ background: 'rgba(230,50,50,0.06)', border: '1px solid rgba(230,50,50,0.15)', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 24 }}>
            <span>Please try different servers if one isn&apos;t working, and consider using ad blockers or the Brave browser.</span>
          </div>

          {/* Server provider grid */}
          <div className="watch-server-grid-container" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>Select Server Source</h3>
            
            <div className="watch-server-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {sources.map((src, i) => {
                const meta = SERVER_META[src.id] || { flag: '🇺🇸' };
                const isActive = sourceIdx === i && !showTrailer;
                return (
                  <button
                    type="button"
                    key={src.id}
                    className={`watch-server-btn${isActive ? ' active' : ''}`}
                    onClick={() => {
                      setSourceIdx(i);
                      setShowTrailer(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: isActive ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.08)',
                      background: isActive ? 'rgba(230,50,50,0.1)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#fff' : 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Server {i + 1}</span>
                    <span 
                      style={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        background: isActive ? 'var(--red)' : '#22c55e', 
                        display: 'block' 
                      }} 
                    />
                  </button>
                );
              })}
            </div>

            {showFallback && !showTrailer && (
              <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                Not working? Try an alternate server source above.
              </p>
            )}
          </div>

          {/* TV Season/Episode Selector - Custom Tabbed UI */}
          {type === 'tv' && (
            <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              
              {/* Stats boxes row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: 1, fontWeight: 700 }}>Studio</p>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '6px 0 0', textTransform: 'uppercase', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={production || 'N/A'}>
                    {production || 'N/A'}
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: 1, fontWeight: 700 }}>Runtime</p>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '6px 0 0', textTransform: 'uppercase', color: '#fff' }}>
                    {runtime_min ? `${runtime_min} Min` : '24 Min'}
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: 1, fontWeight: 700 }}>Rated</p>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '6px 0 0', textTransform: 'uppercase', color: '#fff' }}>
                    {imdb_rating ? `${Number(imdb_rating).toFixed(1)} Rated` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Tabs Bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
                {(['overview', 'episodes', 'reviews'] as const).map(t => {
                  const isActive = activeTab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: isActive ? '2px solid var(--red)' : '2px solid transparent',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Tabs Content */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {plot && (
                    <div>
                      <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>Overview</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>{plot}</p>
                    </div>
                  )}
                  {genre_tags && genre_tags.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, margin: '0 0 8px' }}>Genres</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {genre_tags.map(g => (
                          <span key={g} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {aired && (
                    <div>
                      <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, margin: '0 0 4px' }}>First Aired</h4>
                      <span style={{ fontSize: 13, color: '#fff' }}>{new Date(aired).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, margin: 0 }}>No reviews logged for this TV show yet.</p>
                </div>
              )}

              {activeTab === 'episodes' && (
                <div>
                  {/* Season selector horizontal row */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 16, scrollbarWidth: 'thin' }}>
                    {seasons && seasons.length > 0 ? (
                      seasons.filter(s => s.season_number > 0).map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveSeason(s.season_number);
                            router.push(`/stream/${currentId}?s=${s.season_number}&e=1${searchParams.get('type') ? `&type=${searchParams.get('type')}` : ''}`);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: activeSeason === s.season_number ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.08)',
                            background: activeSeason === s.season_number ? 'rgba(230,50,50,0.1)' : 'rgba(255,255,255,0.03)',
                            color: activeSeason === s.season_number ? '#fff' : 'var(--text-dim)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                          }}
                        >
                          {s.name || `Season ${s.season_number}`}
                        </button>
                      ))
                    ) : (
                      // Fallback seasons if TMDB didn't return seasons list
                      [1, 2, 3, 4, 5].map(sNum => (
                        <button
                          key={sNum}
                          onClick={() => {
                            setActiveSeason(sNum);
                            router.push(`/stream/${currentId}?s=${sNum}&e=1${searchParams.get('type') ? `&type=${searchParams.get('type')}` : ''}`);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: activeSeason === sNum ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.08)',
                            background: activeSeason === sNum ? 'rgba(230,50,50,0.1)' : 'rgba(255,255,255,0.03)',
                            color: activeSeason === sNum ? '#fff' : 'var(--text-dim)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                          }}
                        >
                          Season {sNum}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Watched progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    <span>{watchedInSeasonCount} OF {seasonEpisodesCount} WATCHED • {watchedPercentage}%</span>
                  </div>

                  {/* Action bar (Select All / Expand) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: 999, marginBottom: 16 }}>
                    <button
                      onClick={toggleSelectAll}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Check size={14} />
                      <span>{isAllWatched ? 'Deselect All' : 'Select All'}</span>
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>

                  {/* Episodes list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {episodesLoading ? (
                      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                        <Spinner size={16} />
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading episodes…</span>
                      </div>
                    ) : episodes.length > 0 ? (
                      episodes.map(ep => {
                        const isWatched = !!watchedEpisodes[`${activeSeason}:${ep.episode_number}`];
                        const isCurrentPlaying = season === activeSeason && episode === ep.episode_number;
                        return (
                          <div
                            key={ep.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: 8,
                              background: isCurrentPlaying ? 'rgba(230,50,50,0.06)' : 'rgba(255,255,255,0.02)',
                              border: isCurrentPlaying ? '1px solid rgba(230,50,50,0.2)' : '1px solid rgba(255,255,255,0.04)',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                              {/* Circle Checkbox */}
                              <button
                                onClick={() => toggleWatched(activeSeason, ep.episode_number)}
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  border: isWatched ? '2px solid var(--red)' : '2px solid rgba(255,255,255,0.3)',
                                  background: isWatched ? 'var(--red)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  padding: 0,
                                  color: '#fff',
                                  flexShrink: 0
                                }}
                                aria-label={`Mark episode ${ep.episode_number} as ${isWatched ? 'unwatched' : 'watched'}`}
                              >
                                {isWatched && <Check size={10} strokeWidth={3} />}
                              </button>
                              {/* Monospace EP Number */}
                              <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', fontWeight: 600, flexShrink: 0 }}>
                                EP {String(ep.episode_number).padStart(2, '0')}
                              </span>
                              {/* Episode Title */}
                              <span style={{ fontSize: 13, color: isCurrentPlaying ? '#fff' : 'var(--text-dim)', fontWeight: isCurrentPlaying ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ep.name || `Episode ${ep.episode_number}`}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 12, flexShrink: 0 }}>
                              {/* Duration */}
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                                {ep.runtime ? `${ep.runtime} min` : '24 min'}
                              </span>
                              {/* Play Button */}
                              <button
                                onClick={() => {
                                  router.push(`/stream/${currentId}?s=${activeSeason}&e=${ep.episode_number}${searchParams.get('type') ? `&type=${searchParams.get('type')}` : ''}`);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: isCurrentPlaying ? 'var(--red)' : 'rgba(255,255,255,0.7)',
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 24,
                                  height: 24,
                                  transition: 'transform 0.15s'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                title="Play Episode"
                                aria-label={`Play episode ${ep.episode_number}`}
                              >
                                <Play size={14} fill="currentColor" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        No episodes found for this season.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Sidebar metadata details */}
        <div className="watch-sidebar" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', maxHeight: '100vh' }}>
          
          {/* Poster & metadata top card */}
          <div className="watch-sidebar-poster-card" style={{ display: 'flex', gap: 16 }}>
            <div style={{ position: 'relative', width: 90, height: 130, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
              {poster_url ? (
                <Image
                  src={poster_url}
                  alt={title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="120px"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAAXBAvwf/q4+AAAAAElRU5ErkJggg=="
                />
              ) : (
                <div style={{ height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              )}
              {imdb_rating && (
                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', padding: '2px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#f59e0b', border: '1px solid rgba(255,255,255,0.15)' }}>
                  ★ {Number(imdb_rating).toFixed(1)}
                </div>
              )}
            </div>
            
            {/* Metadata right side */}
            <div className="watch-sidebar-meta" style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Status:</span>
                <span style={{ marginLeft: 6, color: '#fff' }}>{status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Production:</span>
                <span style={{ marginLeft: 6, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{production || 'N/A'}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Aired:</span>
                <span style={{ marginLeft: 6, color: '#fff' }}>{aired ? new Date(aired).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h1>
            {year && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{year}</span>}
          </div>

          {/* Plot Box description */}
          {plot && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>{plot}</p>
            </div>
          )}

          {/* Genre tags */}
          {genre_tags && genre_tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {genre_tags.map(g => (
                <span key={g} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>{g}</span>
              ))}
            </div>
          )}

          {/* Trailers Section */}
          {trailerKey && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>Trailers</h3>
              
              <button
                onClick={() => setShowTrailer(!showTrailer)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  borderRadius: 8,
                  background: showTrailer ? 'var(--red)' : 'rgba(255,255,255,0.05)',
                  border: showTrailer ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Play size={14} fill="currentColor" />
                <span>{showTrailer ? 'Back to Movie' : 'Official Trailer'}</span>
              </button>
            </div>
          )}

          {/* Cast list section */}
          {castItems.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', margin: 0 }}>Characters</h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>view all</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {castItems.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                      {c.profile_path ? (
                        <Image
                          src={c.profile_path}
                          alt={c.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="48px"
                        />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                          {c.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{c.character || 'Cast member'}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{c.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Download Options Modal */}
      {showDownloadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: 12, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Download Options</h3>
              <button onClick={() => setShowDownloadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>Select an option below to search external torrent databases for <strong>{title}</strong>:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* YTS */}
              <a 
                href={`https://yts.mx/browse-movies/${encodeURIComponent(title)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
              >
                <span>Search YTS.mx</span>
                <ExternalLink size={14} />
              </a>

              {/* Torrentz */}
              <a 
                href={`https://torrentz2.nz/search?q=${encodeURIComponent(title + ' ' + (year || ''))}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
              >
                <span>Search Torrentz2</span>
                <ExternalLink size={14} />
              </a>

              {/* 1337x */}
              <a 
                href={`https://1337x.to/search/${encodeURIComponent(title + ' ' + (year || ''))}/1/`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
              >
                <span>Search 1337x.to</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
