import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/ratelimit';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isUnrestrictedUser } from '@/lib/guards';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Mood-passthrough params we allow from the client
const ALLOWED_MOOD_PARAMS = [
  'sort_by',
  'vote_average.gte',
  'vote_average.lte',
  'vote_count.gte',
  'vote_count.lte',
  'with_runtime.lte',
  'with_runtime.gte',
  'primary_release_date.gte',
  'primary_release_date.lte',
  'first_air_date.gte',
  'first_air_date.lte',
  'with_keywords',
  'without_keywords',
  'with_genres',
  'without_genres',
] as const;

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
  const rawPage  = parseInt(searchParams.get('page') || '1', 10);
  const page     = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), 500);
  const language = searchParams.get('with_original_language');
  const country  = searchParams.get('with_origin_country');
  const type     = searchParams.get('type') || 'movie';
  const isMood   = searchParams.has('mood');

  const incomingGenres          = searchParams.get('with_genres');
  const incomingWithoutGenres   = searchParams.get('without_genres');
  const incomingKeywords        = searchParams.get('with_keywords');
  const incomingWithoutKeywords = searchParams.get('without_keywords');

  // Base discover URL
  const tmdbUrl = new URL(`https://api.themoviedb.org/3/discover/${type === 'tv' ? 'tv' : 'movie'}`);
  
  if (isUnrestricted) {
    // Unrestricted users: respect any requested genres or keywords without forcing horror or blocking family/animation
    if (incomingGenres) tmdbUrl.searchParams.set('with_genres', incomingGenres);
    if (incomingWithoutGenres) tmdbUrl.searchParams.set('without_genres', incomingWithoutGenres);
  } else {
    // Enforce horror/thriller/sci-fi genres and exclude animation/anime/family/etc for TV
    if (type === 'tv') {
      const tvGenres = incomingGenres
        ? incomingGenres.replace(/\b27\b/g, '9648|10765|53')
        : '9648|10765|53';
      tmdbUrl.searchParams.set('with_genres', tvGenres);
      tmdbUrl.searchParams.set('without_genres', incomingWithoutGenres || '16,10762,10751,10764,10766,10767,10763,99');
    } else {
      // Default to Horror (27). If caller specified a genre combination (e.g. '27,35' for comedy or '27,878' for sci-fi), use it.
      tmdbUrl.searchParams.set('with_genres', incomingGenres || '27');
      if (incomingWithoutGenres) {
        tmdbUrl.searchParams.set('without_genres', incomingWithoutGenres);
      } else {
        // Exclude animation (16) and family (10751) to filter out kids/cartoons
        tmdbUrl.searchParams.set('without_genres', '16,10751');
      }
    }
  }
  tmdbUrl.searchParams.set('page', String(page));
  tmdbUrl.searchParams.set('include_adult', 'false');
  
  if (isMood) {
    // Apply mood-specific params (overrides defaults)
    ALLOWED_MOOD_PARAMS.forEach(param => {
      const val = searchParams.get(param);
      if (val) tmdbUrl.searchParams.set(param, val);
    });
    // If no sort_by provided by mood, default to popularity
    if (!searchParams.get('sort_by')) {
      tmdbUrl.searchParams.set('sort_by', 'popularity.desc');
    }
    // Enforce release date <= today if not explicitly set by the mood (excludes unreleased movies)
    const today = new Date().toISOString().split('T')[0];
    if (!searchParams.get('primary_release_date.lte') && !searchParams.get('first_air_date.lte')) {
      if (type === 'tv') {
        tmdbUrl.searchParams.set('first_air_date.lte', today);
      } else {
        tmdbUrl.searchParams.set('primary_release_date.lte', today);
      }
    }
  } else {
    // Default (non-mood) discover
    tmdbUrl.searchParams.set('sort_by', 'popularity.desc');
    // Forward optional keyword filters
    if (incomingKeywords) tmdbUrl.searchParams.set('with_keywords', incomingKeywords);
    if (incomingWithoutKeywords) tmdbUrl.searchParams.set('without_keywords', incomingWithoutKeywords);
    // Exclude unreleased future media
    const today = new Date().toISOString().split('T')[0];
    if (type === 'tv') {
      tmdbUrl.searchParams.set('first_air_date.lte', today);
    } else {
      tmdbUrl.searchParams.set('primary_release_date.lte', today);
    }
  }

  if (language) tmdbUrl.searchParams.set('with_original_language', language);
  if (country)  tmdbUrl.searchParams.set('with_origin_country', country);

  const fetchWithFallback = async () => {
    let res = await fetch(tmdbUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'accept': 'application/json'
      },
      next: { revalidate: isMood ? 3600 : 3600 }
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
    
    // Filter out movies without posters
    if (data.results) {
      data.results = data.results.filter((movie: { poster_path: string | null }) => movie.poster_path);
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: unknown) {
    console.error('TMDB Discover Error:', err);
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
  }
}


