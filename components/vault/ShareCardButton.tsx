'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Share2, Download, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCORE_FIELDS } from '@/lib/config';
import type { Entry } from '@/lib/types';

// Recommend badge colors
const RECOMMEND_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  Peak:    { color: '#c084fc', bg: 'rgba(192,132,252,0.18)', border: 'rgba(192,132,252,0.5)' },
  Yes:     { color: '#4ade80', bg: 'rgba(74,222,128,0.18)',  border: 'rgba(74,222,128,0.5)'  },
  No:      { color: '#f87171', bg: 'rgba(248,113,113,0.18)', border: 'rgba(248,113,113,0.5)' },
  Garbage: { color: '#9ca3af', bg: 'rgba(156,163,175,0.18)', border: 'rgba(156,163,175,0.5)' },
};

interface ShareCardProps {
  entry: Entry;
}

// Proxy image URL through Next.js so html2canvas can capture it cross-origin
function proxyUrl(url: string | null | undefined, w = 400) {
  if (!url) return null;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=90`;
}

// Portrait card — cinematic, full-bleed, no score breakdown. Pure impact.
function PortraitCard({ entry, poster }: { entry: Entry, poster: string | null }) {
  const { movie } = entry;
  const title    = movie.title ?? 'Unknown';
  const recStyle = entry.recommend ? RECOMMEND_STYLE[entry.recommend] : null;

  return (
    <div
      style={{
        position: 'relative',
        width: 360,
        height: 640,
        background: '#0a0a0a',
        overflow: 'hidden',
        fontFamily: "'Inter', 'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Full-bleed poster */}
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
      )}

      {/* Gradient vignette — dark top + dark bottom, clear in middle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(
              to bottom,
              rgba(0,0,0,0.85) 0%,
              rgba(0,0,0,0.30) 25%,
              rgba(0,0,0,0.05) 45%,
              rgba(0,0,0,0.05) 55%,
              rgba(0,0,0,0.75) 75%,
              rgba(0,0,0,0.98) 100%
            )
          `,
        }}
      />

      {/* Top: VAULT badge */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: '#fff',
            background: '#e63232',
            padding: '4px 10px',
            borderRadius: 4,
          }}
        >
          VAULT
        </span>
        {recStyle && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: recStyle.color,
              background: recStyle.bg,
              border: `1px solid ${recStyle.border}`,
              padding: '4px 10px',
              borderRadius: 4,
            }}
          >
            {entry.recommend}
          </span>
        )}
      </div>

      {/* Bottom content — over dark gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '0 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {movie.year && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1.5,
                color: 'rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '4px 10px',
                borderRadius: 4,
              }}
            >
              {movie.year}
            </span>
          )}
          {entry.subgenre && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '4px 10px',
                borderRadius: 4,
              }}
            >
              {entry.subgenre}
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: "'Bebas Neue', impact, sans-serif",
            fontSize: title.length > 20 ? 38 : 48,
            fontWeight: 400,
            color: '#fff',
            lineHeight: 0.95,
            margin: 0,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h2>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontFamily: "'Bebas Neue', impact, sans-serif",
              fontSize: 80,
              fontWeight: 400,
              color: '#e63232',
              lineHeight: 1,
              letterSpacing: -1,
            }}
          >
            {entry.total ?? '—'}
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 6,
            }}
          >
            /10
          </span>
        </div>

        {/* Divider + brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: 12,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: '#e63232',
            }}
          >
            VAULT
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: 1,
            }}
          >
            personal horror tracker
          </span>
        </div>
      </div>
    </div>
  );
}

// Square card — editorial split: poster left, content right
function SquareCard({ entry, poster }: { entry: Entry, poster: string | null }) {
  const { movie } = entry;
  const title    = movie.title ?? 'Unknown';
  const recStyle = entry.recommend ? RECOMMEND_STYLE[entry.recommend] : null;

  // Show only fields that have a value > 0
  const scoredFields = SCORE_FIELDS.filter(f => {
    const v = entry[f.key as keyof Entry] as number | null;
    return v !== null && v > 0;
  }).slice(0, 6);

  return (
    <div
      style={{
        position: 'relative',
        width: 360,
        height: 450,
        background: '#0a0a0a',
        overflow: 'hidden',
        display: 'flex',
        fontFamily: "'Inter', 'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Left: poster */}
      <div style={{ width: '42%', position: 'relative', flexShrink: 0 }}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#1a1a1a' }} />
        )}
        {/* Edge fade into right panel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, transparent 60%, #0a0a0a 100%)',
          }}
        />
      </div>

      {/* Right: content */}
      <div
        style={{
          flex: 1,
          padding: '20px 20px 20px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top: VAULT badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#e63232',
            }}
          >
            VAULT
          </span>
          {recStyle && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: recStyle.color,
                background: recStyle.bg,
                border: `1px solid ${recStyle.border}`,
                padding: '3px 7px',
                borderRadius: 4,
              }}
            >
              {entry.recommend}
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          {movie.year && (
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, margin: '0 0 4px', textTransform: 'uppercase' }}>
              {movie.year}
              {entry.subgenre ? ` · ${entry.subgenre}` : ''}
            </p>
          )}
          <h2
            style={{
              fontFamily: "'Bebas Neue', impact, sans-serif",
              fontSize: title.length > 16 ? 26 : 32,
              fontWeight: 400,
              color: '#fff',
              lineHeight: 0.95,
              margin: 0,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h2>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span
            style={{
              fontFamily: "'Bebas Neue', impact, sans-serif",
              fontSize: 56,
              fontWeight: 400,
              color: '#e63232',
              lineHeight: 1,
              letterSpacing: -1,
            }}
          >
            {entry.total ?? '—'}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 4,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            /10
          </span>
        </div>

        {/* Score mini-bars (compact, only filled fields) */}
        {scoredFields.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 8,
            }}
          >
            {scoredFields.map(field => {
              const val = entry[field.key as keyof Entry] as number | null;
              const pct = val !== null ? (val / field.max) * 100 : 0;
              return (
                <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', minWidth: 52, flexShrink: 0 }}>
                    {field.label}
                  </span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #e63232 0%, #ff6060 100%)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', minWidth: 20, textAlign: 'right' }}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Brand */}
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, margin: 0, textTransform: 'uppercase' }}>
          vault · personal horror tracker
        </p>
      </div>
    </div>
  );
}

export default function ShareCardButton({ entry }: ShareCardProps) {
  const [open,       setOpen]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [format,     setFormat]     = useState<'portrait' | 'square'>('portrait');
  const [posterData, setPosterData] = useState<string | null>(null);
  const cardRef                     = useRef<HTMLDivElement>(null);

  const { movie } = entry;
  const title = movie.title ?? 'Unknown';

  // Preload poster as data URL to avoid html2canvas CORS issues
  useEffect(() => {
    if (!open || !movie.poster_url) return;
    
    let isMounted = true;
    const fetchPoster = async () => {
      try {
        const pUrl = proxyUrl(movie.poster_url, 600);
        if (!pUrl) return;
        const res = await fetch(pUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && reader.result) {
            setPosterData(reader.result as string);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Failed to preload poster', err);
      }
    };
    
    fetchPoster();
    
    return () => { isMounted = false; };
  }, [open, movie.poster_url]);

  const generate = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const blob    = await (await fetch(dataUrl)).blob();
      const file    = new File([blob], `vault-${title.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `My ${title} review — Vault`, files: [file] });
      } else {
        const link  = document.createElement('a');
        link.download = file.name;
        link.href   = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share card error:', err);
    } finally {
      setGenerating(false);
    }
  }, [title]);

  return (
    <>
      <button
        className="btn-edit share-card-trigger"
        onClick={() => setOpen(true)}
        title="Share review card"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Share2 size={14} />
        Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="share-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              className="share-panel"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="share-panel-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--red)' }}>
                    Review Card
                  </span>
                  <span className="share-panel-title">{title}</span>
                </div>
                <button className="roulette-close" onClick={() => setOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              {/* Format toggle */}
              <div className="share-format-toggle">
                <button
                  className={`share-format-btn${format === 'portrait' ? ' active' : ''}`}
                  onClick={() => setFormat('portrait')}
                >
                  Portrait 9:16
                </button>
                <button
                  className={`share-format-btn${format === 'square' ? ' active' : ''}`}
                  onClick={() => setFormat('square')}
                >
                  Square 4:5
                </button>
              </div>

              {/* Card preview — scaled to fit modal */}
              <div className="share-card-preview-wrap">
                <div
                  className="share-card-preview-scaler"
                  style={{
                    transform: format === 'portrait' ? 'scale(0.62)' : 'scale(0.74)',
                    transformOrigin: 'top center',
                    width: format === 'portrait' ? 360 : 360,
                    height: format === 'portrait' ? 640 : 450,
                    marginBottom: format === 'portrait' ? `calc((640px * 0.62) - 640px)` : `calc((450px * 0.74) - 450px)`,
                  }}
                >
                  {/* The actual card — this is what gets screenshotted */}
                  <div ref={cardRef}>
                    {format === 'portrait'
                      ? <PortraitCard entry={entry} poster={posterData} />
                      : <SquareCard   entry={entry} poster={posterData} />
                    }
                  </div>
                </div>
              </div>

              {/* Tip */}
              <p className="share-tip">
                <Sparkles size={11} />
                Downloads at 3× resolution for crisp social sharing
              </p>

              {/* Actions */}
              <div className="share-panel-actions">
                <button
                  className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={generate}
                  disabled={generating}
                >
                  {generating ? (
                    'Generating…'
                  ) : typeof navigator !== 'undefined' && 'share' in navigator ? (
                    <><Share2 size={15} /> Share Image</>
                  ) : (
                    <><Download size={15} /> Download PNG</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
