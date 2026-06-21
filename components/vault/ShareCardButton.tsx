'use client';

import { useRef, useState } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { SCORE_FIELDS } from '@/lib/config';
import type { Entry } from '@/lib/types';

const RECOMMEND_STYLE: Record<string, { color: string; label: string }> = {
  Peak:    { color: '#9b59f5', label: 'Peak' },
  Yes:     { color: '#52b044', label: 'Yes'  },
  No:      { color: '#e63232', label: 'No'   },
  Garbage: { color: '#6b6b6b', label: 'Garbage' },
};

interface ShareCardProps {
  entry: Entry;
}

export default function ShareCardButton({ entry }: ShareCardProps) {
  const [open,       setOpen]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef                     = useRef<HTMLDivElement>(null);

  const { movie } = entry;
  const title     = movie.title ?? 'Unknown';
  const recStyle  = entry.recommend ? RECOMMEND_STYLE[entry.recommend] : null;

  async function generate() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');

      // Try native share (mobile)
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `vault-${title.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `My ${title} review — Vault`,
          files: [file],
        });
      } else {
        // Fallback: download
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share card error:', err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <button
        className="btn-edit share-card-trigger"
        onClick={() => setOpen(true)}
        title="Share review card"
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
            onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              className="share-panel"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="share-panel-header">
                <span className="share-panel-title">Review Card Preview</span>
                <button className="roulette-close" onClick={() => setOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              {/* The card to screenshot */}
              <div className="share-card-wrapper">
                <div ref={cardRef} className="share-card">
                  {/* Background poster blur */}
                  {movie.backdrop_url || movie.poster_url ? (
                    <div className="share-card-bg">
                      <Image
                        src={(movie.backdrop_url ?? movie.poster_url)!}
                        alt=""
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="480px"
                        crossOrigin="anonymous"
                      />
                      <div className="share-card-bg-overlay" />
                    </div>
                  ) : (
                    <div className="share-card-bg share-card-bg--fallback" />
                  )}

                  {/* Content */}
                  <div className="share-card-content">
                    {/* Header row */}
                    <div className="share-card-top">
                      {/* Poster */}
                      {movie.poster_url && (
                        <div className="share-card-poster">
                          <Image
                            src={movie.poster_url}
                            alt={title}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="80px"
                            crossOrigin="anonymous"
                          />
                        </div>
                      )}
                      {/* Title + meta */}
                      <div className="share-card-meta">
                        <p className="share-card-eyebrow">Vault Review</p>
                        <h2 className="share-card-title">{title}</h2>
                        <div className="share-card-chips">
                          {movie.year && <span>{movie.year}</span>}
                          {entry.subgenre && <span>{entry.subgenre}</span>}
                          {recStyle && (
                            <span style={{ color: recStyle.color }}>{recStyle.label}</span>
                          )}
                        </div>
                      </div>
                      {/* Score */}
                      <div className="share-card-score-badge">
                        <span className="share-card-score-val">{entry.total}</span>
                        <span className="share-card-score-denom">/10</span>
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="share-card-bars">
                      {SCORE_FIELDS.map(field => {
                        const val = entry[field.key as keyof Entry] as number | null;
                        const pct = val !== null ? (val / field.max) * 100 : 0;
                        return (
                          <div key={field.key} className="share-bar-row">
                            <span className="share-bar-label">{field.label}</span>
                            <div className="share-bar-track">
                              <div className="share-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="share-bar-val">{val ?? '—'}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="share-card-footer">
                      <span className="share-card-brand">vault —</span>
                      <span className="share-card-tagline">personal horror tracker</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="share-panel-actions">
                <button
                  className="roulette-spin-btn"
                  onClick={generate}
                  disabled={generating}
                >
                  {generating ? (
                    'Generating…'
                  ) : typeof navigator !== 'undefined' && 'share' in navigator ? (
                    <><Share2 size={15} /> Share</>
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
