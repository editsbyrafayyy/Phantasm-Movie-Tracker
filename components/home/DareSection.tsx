import PageHeader from '@/components/ui/PageHeader';
import DareBox, { type TopDare } from './DareBox';
import { createServiceClient } from '@/lib/supabase/server';

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
          subtitle="Think I’m missing something? Pick a horror, thriller or sci-fi film and dare me to watch it. I can’t promise I’ll like it."
          className="dare-header"
        />
        <DareBox top={top} />
      </div>
    </section>
  );
}
