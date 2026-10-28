import PageHeader from '@/components/ui/PageHeader';
import DareBox, { type TopDare } from './DareBox';
import { createServiceClient } from '@/lib/supabase/server';

const OWNER = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? 'Rafayyy';

/** "Dare me to watch": visitors pick a film for the owner; the most-dared are listed. */
export default async function DareSection() {
  let top: TopDare[] = [];
  try {
    const { data } = await createServiceClient()
      .from('dares')
      .select('tmdb_id, title, year, votes')
      .eq('status', 'pending')
      .order('votes', { ascending: false })
      .order('last_dared_at', { ascending: false })
      .limit(5);
    top = (data ?? []) as TopDare[];
  } catch { /* table not created yet — the box still renders */ }

  return (
    <section className="dare-section" aria-label="Dare me to watch">
      <div className="dare-panel">
        <PageHeader
          as="section"
          eyebrow="Your move"
          title="Dare me"
          accent="to watch"
          subtitle={`Think something belongs in the vault? Pick a horror, thriller or sci-fi film and dare ${OWNER} to watch it.`}
          className="dare-header"
        />
        <DareBox owner={OWNER} top={top} />
      </div>
    </section>
  );
}
