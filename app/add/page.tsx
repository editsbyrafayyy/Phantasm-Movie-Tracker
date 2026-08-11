import type { Metadata } from 'next';
import { Suspense } from 'react';
import AddMovieForm from '@/components/forms/AddMovieForm';
import Spinner from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'Add a Movie — Phantasm',
};

export default function AddMoviePage() {
  return (
    <div className="page-container form-page">
      <header className="form-header">
        <p className="page-label">Log a</p>
        <h1 className="page-title-serif">Movie.</h1>
        <p className="form-subtitle">Every field except title and subgenre is optional.</p>
      </header>

      <Suspense fallback={<div className="form-loading"><Spinner size={24} /> Loading form…</div>}>
        <AddMovieForm />
      </Suspense>
    </div>
  );
}
