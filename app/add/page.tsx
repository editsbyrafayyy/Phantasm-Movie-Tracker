import type { Metadata } from 'next';
import AddMovieForm from '@/components/forms/AddMovieForm';

export const metadata: Metadata = {
  title: 'Add a Movie — Vault',
};

export default function AddMoviePage() {
  return (
    <div className="page-container form-page">
      <header className="form-header">
        <p className="page-label">Log a</p>
        <h1 className="page-title-serif">Movie.</h1>
        <p className="form-subtitle">Every field except title and subgenre is optional.</p>
      </header>

      <AddMovieForm />
    </div>
  );
}
