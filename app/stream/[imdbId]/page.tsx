import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import VideoPlayerClient from '@/components/stream/VideoPlayerClient';
import type { StreamEmbed } from '@/lib/types';

type Props = { params: Promise<{ imdbId: string }> };

export default async function WatchPage({ params }: Props) {
  const { imdbId } = await params;

  // Auth check — streaming is members only
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login?next=/stream/' + imdbId);

  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const res = await fetch(`${base}/api/stream/${imdbId}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const embed: StreamEmbed = await res.json();

  return <VideoPlayerClient {...embed} />;
}
