export function VaultSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="movie-grid" style={{ marginTop: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            className="skeleton"
            style={{
              aspectRatio: '2/3',
              borderRadius: 10,
              animationDelay: `${i * 60}ms`,
            }}
          />
          <div className="skeleton" style={{ height: 14, width: '75%', borderRadius: 4, animationDelay: `${i * 60 + 40}ms` }} />
          <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 4, animationDelay: `${i * 60 + 80}ms` }} />
        </div>
      ))}
    </div>
  );
}
