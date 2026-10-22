'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type Busy = 'moods' | 'cache' | 'orphans' | null;

async function call(url: string, method: string, fallback: string) {
  const res = await fetch(url, { method });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

/** One-click maintenance jobs. Every route re-checks OWNER_USER_ID server-side. */
export default function AdminActions({ orphanCount }: { orphanCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function run(job: Exclude<Busy, null>, fn: () => Promise<string>) {
    setBusy(job);
    setToast(null);
    try {
      setToast({ message: await fn(), type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Something went wrong', type: 'error' });
    } finally {
      setBusy(null);
    }
  }

  const jobs = [
    {
      id: 'cache' as const,
      title: 'Refresh site data',
      desc: 'Home, Vault and Stream cache your vault for 5 minutes. Clear it to show changes now.',
      label: 'Refresh now',
      onClick: () => run('cache', async () => {
        await call('/api/admin/revalidate', 'POST', 'Failed to refresh');
        return 'Site data refreshed.';
      }),
    },
    {
      id: 'moods' as const,
      title: 'Rebuild mood picks',
      desc: 'Recompute the “Pick by mood” pools on Stream from your vault and TMDB.',
      label: 'Rebuild',
      onClick: () => run('moods', async () => {
        await call('/api/stream/moods/refresh', 'POST', 'Failed to rebuild mood picks');
        return 'Mood picks rebuilt.';
      }),
    },
    {
      id: 'orphans' as const,
      title: 'Remove unused films',
      desc: orphanCount
        ? `${orphanCount} catalog film${orphanCount === 1 ? ' is' : 's are'} not rated by anyone or saved to a list.`
        : 'Every catalog film is rated by someone or saved to a list.',
      label: 'Remove',
      disabled: orphanCount === 0,
      onClick: () => setConfirming(true),
    },
  ];

  return (
    <>
      <ul className="admin-jobs">
        {jobs.map(j => (
          <li key={j.id} className="admin-job">
            <div className="admin-job-text">
              <p className="admin-job-title">{j.title}</p>
              <p className="admin-job-desc">{j.desc}</p>
            </div>
            <button
              type="button"
              className={j.id === 'orphans' ? 'btn-outline-danger admin-job-btn' : 'btn-secondary admin-job-btn'}
              onClick={j.onClick}
              disabled={busy !== null || j.disabled}
            >
              {busy === j.id ? 'Working…' : j.label}
            </button>
          </li>
        ))}
      </ul>

      {confirming && (
        <ConfirmDialog
          title="Remove unused films?"
          body={`This permanently deletes ${orphanCount} film${orphanCount === 1 ? '' : 's'} from the catalog. Nobody's ratings, lists or Watch Later are affected.`}
          confirmLabel="Remove"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            run('orphans', async () => {
              const data = await call('/api/admin/orphans', 'DELETE', 'Failed to remove films');
              router.refresh();
              return `Removed ${data.removed ?? 0} unused film${data.removed === 1 ? '' : 's'}.`;
            });
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </>
  );
}
