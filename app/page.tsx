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
          <em>Log the</em>
          {' '}
          <strong>Horror.</strong>
          <br />
          <em>Rate the</em>
          {' '}
          <strong>Fear.</strong>
        </h1>

        <p className="hero-sub">
          Your mobile-first horror tracker. Add a film, score it, and it goes straight into your sheet.
        </p>

        <Link href="/add" className="hero-cta">
          Add a Movie →
        </Link>
      </div>
    </section>
  );
}
