import type { Metadata } from 'next';
import UpdateMovieForm from '@/components/UpdateMovieForm';
import HeroBackground from '@/components/HeroBackground';

export const metadata: Metadata = {
  title:       'Revise a Record — Horror Vault',
  description: 'Select an existing movie to revise its scores or recommendation.',
};

export default function UpdateMoviePage() {
  return (
    <div className="page">
      <HeroBackground variant="update" />
      <h1 className="page-heading">
        <span className="title-context">Revise a</span>
        <em className="title-accent">Record.</em>
      </h1>
      <p className="title-sub">Find a film in your vault and update its ratings.</p>

      <UpdateMovieForm />
    </div>
  );
}
