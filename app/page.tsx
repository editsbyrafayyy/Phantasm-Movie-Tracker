import { cookies } from 'next/headers';
import HeroBackground from '@/components/HeroBackground';
import UnlockVault from '@/components/UnlockVault';

export default async function HomePage() {
  const cookieStore = await cookies();
  const isUnlocked  = cookieStore.has('vault_unlocked');

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

        <UnlockVault isUnlocked={isUnlocked} />
      </div>
    </section>
  );
}
