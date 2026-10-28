import { getComingSoonHorror } from '@/lib/tmdb';
import PageHeader from '@/components/ui/PageHeader';
import ComingSoonRow from './ComingSoonRow';

/** `linkable` is false for guests: they see what's coming but can't open the (members-only) pages. */
export default async function ComingSoonWidget({ linkable }: { linkable: boolean }) {
  const films = await getComingSoonHorror();
  if (!films.length) return null;

  // Passed down so server and client agree on "in N days" (no hydration drift).
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="category-section home-section" aria-label="Coming soon">
      <div className="home-section-head">
        <PageHeader
          as="section"
          title="Coming"
          accent="soon"
          subtitle="Horror releases over the next 12 months, by release date."
        />
      </div>
      <ComingSoonRow films={films} today={today} linkable={linkable} />
    </section>
  );
}
