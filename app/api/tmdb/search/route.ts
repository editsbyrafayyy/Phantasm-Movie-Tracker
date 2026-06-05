import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(req: NextRequest) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';
  const type = searchParams.get('type') || 'movie';

  if (!query) {
    return NextResponse.json({ results: [], page: 1, total_pages: 1, total_results: 0 });
  }

  const tmdbUrl = new URL(`https://api.themoviedb.org/3/search/${type === 'tv' ? 'tv' : 'movie'}`);
  tmdbUrl.searchParams.set('query', query);
  tmdbUrl.searchParams.set('page', page);
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
      data.results = data.results.filter((item: any) => {
        if (!item.poster_path) return false;
        
        const genres = item.genre_ids || [];
        
        if (type === 'tv') {
          // TV: must not be Animation (16), Kids (10762), Family (10751), Reality (10764), Soap (10766), Talk (10767), News (10763), Documentary (99)
          const isExcluded = genres.some((id: number) => [16, 10762, 10751, 10764, 10766, 10767, 10763, 99].includes(id));
          if (isExcluded) return false;
          
          // TV: must be Mystery (9648) or Sci-Fi & Fantasy (10765)
          const isTargetGenre = genres.some((id: number) => id === 9648 || id === 10765);
          return isTargetGenre;
        } else {
          // Movie: must be Horror (27) or Thriller (53)
          return genres.some((id: number) => id === 27 || id === 53);
        }
      });
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('TMDB Search Error:', err);
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
  }
}
