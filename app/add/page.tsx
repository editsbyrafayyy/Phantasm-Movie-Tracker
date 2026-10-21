import type { Metadata } from 'next';
import { Suspense } from 'react';
import AddMovieForm from '@/components/forms/AddMovieForm';
import PageHeader from '@/components/ui/PageHeader';
import { FormFieldsSkeleton } from '@/components/forms/FormSkeleton';

export const metadata: Metadata = {
  title: 'Log a Film — Phantasm',
};

export default function AddMoviePage() {
  return (
    <div className="page-container form-page">
      <PageHeader
        title="Log"
        accent="a film"
        subtitle="Only the title and subgenre are required."
      />

      <Suspense fallback={<FormFieldsSkeleton />}>
        <AddMovieForm />
      </Suspense>
    </div>
  );
}
