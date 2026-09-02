import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/ratelimit';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isUnrestrictedUser } from '@/lib/guards';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(req: NextRequest) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  // Enforce IP rate limiting (60 requests per minute per IP)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit(ip, 60, 60_000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // Check if requesting user has unrestricted genre access
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isUnrestricted = isUnrestrictedUser(user);

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), 500);
  const type = searchParams.get('type') || 'movie';

  if (!query) {
    return NextResponse.json(
      { results: [], page: 1, total_pages: 1, total_results: 0 },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  }

  const tmdbUrl = new URL(`https://api.themoviedb.org/3/search/${type === 'tv' ? 'tv' : 'movie'}`);
  tmdbUrl.searchParams.set('query', query);
  tmdbUrl.searchParams.set('page', String(page));
  tmdbUrl.searchParams.set('include_adult', 'false');

  const fetchWithFallback = async () => {
    let res = await fetch(tmdbUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache TMDB results for 1 hour
    });

    if (!res.ok) {
      tmdbUrl.searchParams.set('api_key', TMDB_API_KEY);
      res = await fetch(tmdbUrl.toString(), {
        headers: { 'accept': 'application/json' },
        next: { revalidate: 3600 }
      });
      if (!res.ok) {
        throw new Error(`TMDB error: ${res.status}`);
      }
    }
    return res;
  };

  try {
    const res = await fetchWithFallback();
    const data = await res.json();
    
    // Filter out items without posters and filter by target genres to enforce strict catalog
    if (data.results) {
      data.results = data.results.filter((item: { poster_path?: string | null; genre_ids?: number[] }) => {
        if (!item.poster_path) return false;

        // Unrestricted users can search and access any genre without restrictions
        if (isUnrestricted) return true;
        
        const genres = item.genre_ids || [];
        
        if (type === 'tv') {
          // TV: must not be Animation (16), Kids (10762), Family (10751), Reality (10764), Soap (10766), Talk (10767), News (10763), Documentary (99)
          const isExcluded = genres.some((id: number) => [16, 10762, 10751, 10764, 10766, 10767, 10763, 99].includes(id));
          if (isExcluded) return false;
          
          // TV: must be Mystery (9648), Sci-Fi & Fantasy (10765), Horror (27), or Thriller (53)
          const isTargetGenre = genres.some((id: number) => [9648, 10765, 27, 53].includes(id));
          return isTargetGenre;
        } else {
          // Movie: must not be Animation (16) or Family (10751)
          const isExcluded = genres.some((id: number) => [16, 10751].includes(id));
          if (isExcluded) return false;

          // Movie: must be Horror (27), Thriller (53), Sci-Fi (878), or Mystery (9648)
          return genres.some((id: number) => [27, 53, 878, 9648].includes(id));
        }
      });
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: unknown) {
    console.error('TMDB Search Error:', err);
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
  }
}

