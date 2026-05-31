import type { Metadata } from 'next';
import AddMovieForm from '@/components/AddMovieForm';

export const metadata: Metadata = {
  title:       'Add a Movie — Horror Vault',
  description: 'Log a new horror movie to your personal tracker. Fill in the title, subgenre, scores, and submit.',
};

export default function AddPage() {
  return (
    <div className="add-page">
      <h1 className="add-page-heading">Log a Movie</h1>
      <p className="add-page-sub">
        Fill in what you know — all fields except title and subgenre are optional.
      </p>
      <AddMovieForm />
    </div>
  );
}
