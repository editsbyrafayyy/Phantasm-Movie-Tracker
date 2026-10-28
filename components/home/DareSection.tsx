import PageHeader from '@/components/ui/PageHeader';
import DareBox, { type TopDare } from './DareBox';
import { createServiceClient } from '@/lib/supabase/server';

/** "Recommend me something": visitors suggest a film for the owner; the most-suggested are listed. */
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
    <section className="dare-section" aria-label="Recommend me something">
      <div className="dare-panel">
        <PageHeader
          as="section"
          eyebrow="Suggestions"
          title="Recommend me"
          accent="something"
          subtitle="Know a horror, thriller or sci-fi film I haven’t seen? Search for it and send it my way."
          className="dare-header"
        />
        <DareBox top={top} />
      </div>
    </section>
  );
}
