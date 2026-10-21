import type { Metadata } from 'next';
import { Suspense } from 'react';
import UpdateMovieForm from '@/components/forms/UpdateMovieForm';
import PageHeader from '@/components/ui/PageHeader';
import { FormFieldsSkeleton } from '@/components/forms/FormSkeleton';

export const metadata: Metadata = {
  title: 'Edit Rating — Phantasm',
};

export default function UpdatePage() {
  return (
    <div className="page-container form-page">
      <PageHeader title="Edit" accent="rating" />

      <Suspense fallback={<FormFieldsSkeleton />}>
        <UpdateMovieForm />
      </Suspense>
    </div>
  );
}
