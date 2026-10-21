'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2 } from 'lucide-react';

/**
 * Calls the refresh route batch by batch until every film with gaps has been
 * re-checked against OMDB/TMDB, then reloads the page data.
 */
export default function CatalogFixButton({ total }: { total: number }) {
  const router = useRouter();
  const [state, setState] = useState<{ running: boolean; checked: number; fixed: number; error?: string; done?: boolean }>(
    { running: false, checked: 0, fixed: 0 },
  );

  async function run() {
    setState({ running: true, checked: 0, fixed: 0 });
    let after: string | null = '';
    let checked = 0;
    let fixed = 0;
    try {
      while (after !== null) {
        const res: Response = await fetch('/api/admin/refresh-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ after }),
        });
        const data: { error?: string; checked?: number; fixed?: number; next?: string | null } =
          await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Refresh failed');
        checked += data.checked ?? 0;
        fixed += data.fixed ?? 0;
        after = data.next ?? null;
        setState({ running: true, checked, fixed });
      }
      setState({ running: false, checked, fixed, done: true });
      router.refresh();
    } catch (err) {
      setState({ running: false, checked, fixed, error: err instanceof Error ? err.message : 'Refresh failed' });
    }
  }

  return (
    <div className="catalog-fix">
      <button type="button" className="btn-secondary" onClick={run} disabled={state.running || total === 0}>
        <Wand2 size={16} aria-hidden="true" />
        {state.running ? `Checking… ${state.checked}/${total}` : 'Fill in missing details'}
      </button>
      <p className="admin-job-desc" role="status">
        {state.error
          ? <span className="field-error">{state.error}</span>
          : state.done
            ? `Checked ${state.checked} film${state.checked === 1 ? '' : 's'}, updated ${state.fixed}. Anything still listed isn't available on OMDB or TMDB — fix it from the film's Edit page.`
            : 'Looks each film up again on OMDB and TMDB and fills only the empty fields.'}
      </p>
    </div>
  );
}
