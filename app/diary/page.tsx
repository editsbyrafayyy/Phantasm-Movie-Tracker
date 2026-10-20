import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DiaryFeedClient, { type DiaryItem } from '@/components/diary/DiaryFeedClient';
import PageHeader from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Diary — Phantasm',
  description: 'Your horror movie watch history and rewatch log.',
};

export default async function DiaryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: diary, error } = await supabase
    .from('diary_entries')
    .select('id, movie_id, watched_at, rewatch, quick_note, movie:movies (id, title, poster_url, year)')
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Diary page fetch error:', error);
  }

  return (
    <div className="page-container diary-page">
      <PageHeader title="Diary" eyebrow="Watch history" />
      <DiaryFeedClient
        initialDiary={(diary ?? []) as unknown as DiaryItem[]}
        loadError={!!error}
      />
    </div>
  );
}
