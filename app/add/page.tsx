import type { Metadata } from 'next';
import { Suspense } from 'react';
import AddMovieForm from '@/components/forms/AddMovieForm';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'Log a Film — Phantasm',
};

export default function AddMoviePage() {
  return (
    <div className="page-container form-page">
      <PageHeader
        title="Log"
        accent="a film"
        subtitle="Only the title and subgenre are required — everything else is optional."
      />

      <Suspense fallback={<div className="form-loading"><Spinner size={24} /> Loading form…</div>}>
        <AddMovieForm />
      </Suspense>
    </div>
  );
}
