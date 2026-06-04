'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Plus, 
  Share2, 
  Download, 
  X,
  ExternalLink
} from 'lucide-react';

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
  status = 'Released',
  production = '',
  aired = '',
  trailerKey = '',
  playlist = [],
  currentId,
  season = 1,
  episode = 1,
}: Props) {
  const router = useRouter();
  const [sourceIdx, setSourceIdx] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const failed = sources.length === 0;
  const currentSource = sources[sourceIdx];

  // Resolve active URL
  const embedUrl = currentSource?.url ?? '';

  // Parse playlist positions
  const currentIdx = playlist.indexOf(currentId);
  const prevId = currentIdx > 0 ? playlist[currentIdx - 1] : null;
  const nextId = currentIdx < playlist.length - 1 ? playlist[currentIdx + 1] : null;

  // Parse cast members safely
  const castItems = (cast_list ?? []).slice(0, 8).map(c => {
    if (typeof c === 'string') {
      try { return JSON.parse(c) as CastMember; }
      catch { return { name: c, profile_path: null } as CastMember; }
    }
    return c as CastMember;
  });

  // Action: Copy Share URL
  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
          <div className="watch-iframe-container" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
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

            {nextId && (
              <button 
                onClick={() => { setShowTrailer(false); router.push(`/stream/${nextId}`); }}
                className="watch-nav-btn right"
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }}
                aria-label="Next movie"
              >
                <ChevronRight size={24} />
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
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                referrerPolicy="no-referrer"
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
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Under player controls */}
          <div className="watch-actions-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', margin: 0 }}>Now Playing</p>
              <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>{title}</h2>
            </div>
            
            {/* Buttons: Add, Share, Download */}
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Add to Vault */}
              <Link 
                href={imdbId ? `/add?omdbId=${imdbId}` : `/add?tmdbId=${tmdbId || ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', textDecoration: 'none' }}
                title="Add to Vault"
              >
                <Plus size={18} />
              </Link>
              
              {/* Share */}
              <button 
                onClick={handleShare}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: copied ? 'var(--green)' : '#fff', cursor: 'pointer' }}
                title="Share stream link"
              >
                <Share2 size={18} />
              </button>

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

          {/* Toast Notification */}
          {copied && (
            <div style={{ background: 'var(--green)', color: '#000', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
              Stream link copied to clipboard!
            </div>
          )}

          {/* Warning banner callout */}
          <div className="watch-warning-banner" style={{ background: 'rgba(230,50,50,0.06)', border: '1px solid rgba(230,50,50,0.15)', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 24 }}>
            <span>🚀 Please try different servers if one isn&apos;t working, and consider using ad blockers or the Brave browser 😊.</span>
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
                    <span style={{ fontSize: 14 }}>{meta.flag}</span>
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.name.toLowerCase()}</span>
                    <span 
                      style={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        background: isActive ? 'var(--red)' : '#22c55e', 
                        display: 'block' 
                      }} 
                    />
                    {meta.sparkles && (
                      <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 10 }} title="Recommended Source">✨</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TV Season/Episode Selector */}
          {type === 'tv' && (
            <div className="watch-tv-selectors" style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16 }}>TV Navigation</h3>
              
              {/* Season tabs */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => router.push(`/stream/${currentId}?s=${s}&e=1`)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: season === s ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.08)',
                      background: season === s ? 'rgba(230,50,50,0.1)' : 'rgba(255,255,255,0.03)',
                      color: season === s ? '#fff' : 'var(--text-dim)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Season {s}
                  </button>
                ))}
              </div>

              {/* Episodes grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: 8 }}>
                {Array.from({ length: 16 }).map((_, idx) => {
                  const epNum = idx + 1;
                  const isCurrent = episode === epNum;
                  return (
                    <button
                      key={epNum}
                      onClick={() => router.push(`/stream/${currentId}?s=${season}&e=${epNum}`)}
                      style={{
                        height: 38,
                        borderRadius: 6,
                        border: isCurrent ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.06)',
                        background: isCurrent ? 'rgba(230,50,50,0.1)' : 'rgba(255,255,255,0.02)',
                        color: isCurrent ? '#fff' : 'var(--text-dim)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      E{epNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Sidebar metadata details */}
        <div className="watch-sidebar" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', maxHeight: '100vh' }}>
          
          {/* Poster & metadata top card */}
          <div className="watch-sidebar-poster-card" style={{ display: 'flex', gap: 16 }}>
            <div style={{ position: 'relative', width: 90, height: 130, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
              {poster_url ? (
                <Image src={poster_url} alt={title} fill style={{ objectFit: 'cover' }} unoptimized />
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
                        <Image src={c.profile_path} alt={c.name} fill style={{ objectFit: 'cover' }} unoptimized />
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
              <button onClick={() => setShowDownloadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
