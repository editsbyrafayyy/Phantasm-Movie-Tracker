import { Calendar } from 'lucide-react';
import { getComingSoonHorror } from '@/lib/tmdb';
import ComingSoonRow from './ComingSoonRow';

export default async function ComingSoonWidget() {
  const films = await getComingSoonHorror();
  if (!films.length) return null;

  return (
    <section className="category-section" style={{ position: 'relative', marginBottom: 8 }}>
      <div className="category-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <span className="otd-eyebrow" style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--red)', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>Releasing This Year</span>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 700, color: 'var(--text)', textTransform: 'none', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Coming Soon <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>in Horror</span></h2>
        </div>
        <Calendar size={22} className="otd-skull-icon" aria-hidden="true" style={{ color: 'var(--text-muted)', opacity: 0.45, flexShrink: 0, marginBottom: 4 }} />
      </div>

      <ComingSoonRow films={films} />
    </section>
  );
}
