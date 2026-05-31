import Link from 'next/link';
import HeroBackground from '@/components/HeroBackground';

export default function HomePage() {
  return (
    <section className="hero">
      {/* Decorative background elements */}
      <HeroBackground />

      {/* Hero content */}
      <div className="hero-content">
        <p className="hero-eyebrow">Personal Horror Film Vault</p>

        <h1 className="hero-headline">
          Track the{' '}
          <em>Horror.</em>
          <br />
          Rate the{' '}
          <strong>Fear.</strong>
        </h1>

        <p className="hero-sub">
          Your personal horror tracker. Add a film, score it across 8 categories,
          and it writes straight to your sheet.
        </p>

        <Link href="/add" className="hero-cta" id="cta-add-movie">
          Add a Movie →
        </Link>
      </div>
    </section>
  );
}
