import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(req: NextRequest) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  const language = searchParams.get('with_original_language');
  const country = searchParams.get('with_origin_country');
  const type = searchParams.get('type') || 'movie';

  // Base discover URL
  const tmdbUrl = new URL(`https://api.themoviedb.org/3/discover/${type === 'tv' ? 'tv' : 'movie'}`);
  
  // Enforce horror/thriller/sci-fi genres and exclude animation/anime/family/etc for TV
  if (type === 'tv') {
    tmdbUrl.searchParams.set('with_genres', '9648|10765|27|53');
    tmdbUrl.searchParams.set('without_genres', '16,10762,10751,10764,10766,10767,10763,99');
  } else {
    tmdbUrl.searchParams.set('with_genres', '27,53');
  }
  tmdbUrl.searchParams.set('page', page);
  tmdbUrl.searchParams.set('sort_by', 'popularity.desc');
  tmdbUrl.searchParams.set('include_adult', 'false');
  
  // Exclude unreleased future media
  const today = new Date().toISOString().split('T')[0];
  if (type === 'tv') {
    tmdbUrl.searchParams.set('first_air_date.lte', today);
  } else {
    tmdbUrl.searchParams.set('primary_release_date.lte', today);
  }

  if (language) {
    tmdbUrl.searchParams.set('with_original_language', language);
  }
  if (country) {
    tmdbUrl.searchParams.set('with_origin_country', country);
  }

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
    
    // Filter out movies without posters
    if (data.results) {
      data.results = data.results.filter((movie: any) => movie.poster_path);
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('TMDB Discover Error:', err);
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
  }
}
