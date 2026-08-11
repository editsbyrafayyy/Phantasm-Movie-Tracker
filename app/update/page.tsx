import type { Metadata } from 'next';
import { Suspense } from 'react';
import UpdateMovieForm from '@/components/forms/UpdateMovieForm';
import Spinner from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'Edit Ratings — Phantasm',
};

export default function UpdatePage() {
  return (
    <div className="page-container form-page">
      <header className="form-header">
        <p className="page-label">Revise a</p>
        <h1 className="page-title-serif">Record.</h1>
      </header>

      <Suspense fallback={<div className="form-loading"><Spinner size={24} /> Loading entry…</div>}>
        <UpdateMovieForm />
      </Suspense>
    </div>
  );
}
