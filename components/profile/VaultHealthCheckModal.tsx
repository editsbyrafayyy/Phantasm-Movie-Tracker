'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, AlertTriangle, CheckCircle, ImageOff, Star, Film } from 'lucide-react';
import type { Entry } from '@/lib/types';

export default function VaultHealthCheckModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !entries.length) {
      setLoading(true);
      fetch('/api/owner-vault')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setEntries(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, entries.length]);

  const audit = useMemo(() => {
    const missingPosters = entries.filter(e => !e.movie?.poster_url && !e.movie?.backdrop_url);
    const unrated = entries.filter(e => e.total === null || e.total === 0);
    const missingMetadata = entries.filter(e => !e.movie?.year || !e.movie?.runtime_min);

    const isHealthy = missingPosters.length === 0 && unrated.length === 0 && missingMetadata.length === 0;

    return {
      missingPosters,
      unrated,
      missingMetadata,
      isHealthy,
      totalCount: entries.length,
    };
  }, [entries]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-edit"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', marginTop: 12 }}
      >
        <Activity size={15} style={{ color: 'var(--accent)' }} />
        <span>Run Vault Health Check</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 540,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    Vault Health Check
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                {loading ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Auditing collection…</p>
                ) : audit.isHealthy ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                    <CheckCircle size={48} style={{ color: '#4a7c3f', marginBottom: 12 }} />
                    <h4 style={{ fontSize: 18, color: 'var(--text)', margin: '0 0 6px' }}>Collection is 100% Healthy!</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                      All {audit.totalCount} films have artwork, scores, and complete metadata.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Unrated items */}
                    {audit.unrated.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
                          <Star size={14} />
                          <span>Unrated Films ({audit.unrated.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {audit.unrated.slice(0, 5).map(e => (
                            <Link key={e.id} href={`/update?id=${e.id}`} onClick={() => setIsOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, textDecoration: 'none', fontSize: 13, color: 'var(--text)' }}>
                              <span>{e.movie?.title}</span>
                              <span style={{ color: 'var(--accent)', fontSize: 12 }}>Rate →</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing posters */}
                    {audit.missingPosters.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#e67e22', fontSize: 13, fontWeight: 700 }}>
                          <ImageOff size={14} />
                          <span>Missing Artwork ({audit.missingPosters.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {audit.missingPosters.slice(0, 5).map(e => (
                            <Link key={e.id} href={`/update?id=${e.id}`} onClick={() => setIsOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, textDecoration: 'none', fontSize: 13, color: 'var(--text)' }}>
                              <span>{e.movie?.title}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Fix match →</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
