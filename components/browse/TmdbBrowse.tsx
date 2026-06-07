'use client';

import { useState, useEffect } from 'react';
import TmdbRow from './TmdbRow';



export default function TmdbBrowse() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = `/api/tmdb/discover?page=1`;

    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setMovies(data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ marginTop: 64, marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '0 32px' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, color: '#fff' }}>Global Library (Horror & Thriller)</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Explore thousands of popular films directly from TMDB.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20, paddingLeft: 32 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 180, height: 270, flexShrink: 0, animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : (
        <TmdbRow label="Trending Horror" movies={movies} />
      )}
    </div>
  );
}
