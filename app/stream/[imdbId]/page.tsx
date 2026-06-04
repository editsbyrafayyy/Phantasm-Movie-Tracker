import VideoPlayerClient from '@/components/stream/VideoPlayerClient';

export default async function StreamPlayerPage({
  params,
}: {
  params: Promise<{ imdbId: string }>;
}) {
  const { imdbId } = await params;

  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  // Default — server figures out movie vs tv from DB
  let embedData = {
    sources: [
      { name: 'Server 1 (VidSrc ME)', url: `https://vidsrc.me/embed/movie?imdb=${imdbId}` },
      { name: 'Server 2 (AutoEmbed)', url: `https://player.autoembed.cc/embed/movie/${imdbId}` }
    ],
    title:       imdbId,
    type:        'movie' as const,
  };

  try {
    const res = await fetch(`${base}/api/stream/${imdbId}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      embedData = data;
    }
  } catch { /* fall through to defaults */ }

  return <VideoPlayerClient {...embedData} />;
}
