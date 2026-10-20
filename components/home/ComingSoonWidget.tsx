import { getComingSoonHorror } from '@/lib/tmdb';
import PageHeader from '@/components/ui/PageHeader';
import ComingSoonRow from './ComingSoonRow';

export default async function ComingSoonWidget() {
  const films = await getComingSoonHorror();
  if (!films.length) return null;

  return (
    <section className="category-section home-section">
      <div className="home-section-head">
        <PageHeader as="section" eyebrow="Releasing this year" title="Coming soon" />
      </div>
      <ComingSoonRow films={films} />
    </section>
  );
}
