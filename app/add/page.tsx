import type { Metadata } from 'next';
import AddMovieForm from '@/components/AddMovieForm';
import HeroBackground from '@/components/HeroBackground';

export const metadata: Metadata = {
  title:       'Log a Movie — Horror Vault',
  description: 'Log a new horror movie to your personal tracker. Fill in the title, subgenre, scores, and submit.',
};

export default function AddPage() {
  return (
    <div className="page">
      <HeroBackground variant="add" />
      <h1 className="page-heading">
        <span className="title-context">Log a</span>
        <em className="title-accent">Movie.</em>
      </h1>
      <p className="title-sub">Every field except title and subgenre is optional.</p>
      <AddMovieForm />
    </div>
  );
}
