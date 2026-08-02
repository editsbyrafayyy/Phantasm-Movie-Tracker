import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DiaryFeedClient from '@/components/diary/DiaryFeedClient';

export const metadata: Metadata = {
  title: 'Diary — Vault',
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
    .select('*, movie:movies (*)')
    .eq('user_id', user.id)
    .order('watched_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Diary page fetch error:', error);
  }

  return (
    <div className="page-container diary-page" style={{ maxWidth: 900, margin: '0 auto' }}>
      <header className="form-header" style={{ marginBottom: 36 }}>
        <p className="page-label">Watch History</p>
        <h1 className="page-title-serif">Your Diary.</h1>
      </header>

      <DiaryFeedClient initialDiary={diary ?? []} />
    </div>
  );
}
