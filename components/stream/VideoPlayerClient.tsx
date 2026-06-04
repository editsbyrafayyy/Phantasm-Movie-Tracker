'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  sources:     { name: string; url: string }[];
  title:       string;
  type:        'movie' | 'tv';
}

export default function VideoPlayerClient({ sources, title }: Props) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showFailed, setShowFailed]     = useState(sources.length === 0);

  const currentSource = sources[sourceIndex];

  function tryNextSource() {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex(prev => prev + 1);
    } else {
      setShowFailed(true);
    }
  }

  return (
    <div className="player-page">
      {/* Header */}
      <div className="player-header">
        <Link href="/stream" className="player-back">
          <ArrowLeft size={15} />
          Back to Browse
        </Link>
        <span className="player-title">{title}</span>
        <div style={{ width: 100 }} />
      </div>

      {/* Player area */}
      <div className="player-iframe-wrap">
        {showFailed ? (
          <div className="player-fallback">
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-dim)' }}>
              Not available on any source right now
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Try again later or search for it on another service.
            </p>
            <Link href="/stream" className="btn-edit" style={{ marginTop: 12 }}>
              ← Back to Browse
            </Link>
          </div>
        ) : (
          <iframe
            key={currentSource?.url}
            className="player-iframe"
            src={currentSource?.url}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            referrerPolicy="no-referrer"
            title={title}
          />
        )}
      </div>

      {/* Source toggle */}
      {!showFailed && (
        <div className="player-source-toggle" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Playing from: {currentSource?.name}
          </span>
          <button className="player-source-btn" onClick={tryNextSource}>
            {sourceIndex === sources.length - 1
              ? 'Still not working? Click to mark unavailable'
              : 'Not loading? Try next server →'}
          </button>
        </div>
      )}
    </div>
  );
}
