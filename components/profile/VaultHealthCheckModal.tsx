'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Entry } from '@/lib/types';

type AuditEntry = Pick<Entry, 'id' | 'total'> & { movie?: Partial<Entry['movie']> | null };

interface Audit {
  unrated:         AuditEntry[];
  missingPosters:  AuditEntry[];
  missingMetadata: AuditEntry[];
  total:           number;
}

function buildAudit(entries: AuditEntry[]): Audit {
  return {
    unrated:         entries.filter(e => e.total === null || e.total === 0),
    missingPosters:  entries.filter(e => !e.movie?.poster_url && !e.movie?.backdrop_url),
    missingMetadata: entries.filter(e => !e.movie?.year || !e.movie?.runtime_min),
    total:           entries.length,
  };
}

const PREVIEW = 5;

function AuditGroup({ title, items, action }: { title: string; items: AuditEntry[]; action: string }) {
  if (items.length === 0) return null;
  return (
    <section className="health-group">
      <h3 className="health-group-title">{title} <span className="health-count">{items.length}</span></h3>
      <ul className="health-list">
        {items.slice(0, PREVIEW).map(e => (
          <li key={e.id}>
            <Link href={`/update?id=${e.id}`} className="health-item">
              <span className="health-item-title">{e.movie?.title ?? 'Untitled'}</span>
              <span className="health-item-action">{action}</span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > PREVIEW && (
        <p className="health-more">and {items.length - PREVIEW} more</p>
      )}
    </section>
  );
}

function HealthCheckBody() {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; audit?: Audit }>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/movies', { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error(String(r.status));
        const data: unknown = await r.json();
        setState({ status: 'ready', audit: buildAudit(Array.isArray(data) ? (data as AuditEntry[]) : []) });
      })
      .catch(err => {
        if ((err as Error)?.name !== 'AbortError') setState({ status: 'error' });
      });
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return <p className="health-status" role="status">Checking your collection…</p>;
  }
  if (state.status === 'error' || !state.audit) {
    return <p className="field-error" role="alert">Could not load your vault. Try again in a moment.</p>;
  }

  const { audit } = state;
  if (audit.total === 0) {
    return <p className="health-status">Your vault is empty — nothing to check yet.</p>;
  }
  if (!audit.unrated.length && !audit.missingPosters.length && !audit.missingMetadata.length) {
    return (
      <div className="health-ok">
        <p className="health-ok-title">All good</p>
        <p className="health-status">All {audit.total} films have artwork, scores and full details.</p>
      </div>
    );
  }

  return (
    <div className="health-groups">
      <AuditGroup title="Unrated"          items={audit.unrated}         action="Rate" />
      <AuditGroup title="Missing artwork"  items={audit.missingPosters}  action="Fix match" />
      <AuditGroup title="Missing details"  items={audit.missingMetadata} action="Fix match" />
    </div>
  );
}

export default function VaultHealthCheckModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="btn-secondary settings-row-btn">
        <ListChecks size={16} aria-hidden="true" />
        Check vault for gaps
      </button>

      {isOpen && (
        <Modal title="Vault check" size="md" onClose={() => setIsOpen(false)}>
          <HealthCheckBody />
        </Modal>
      )}
    </>
  );
}
