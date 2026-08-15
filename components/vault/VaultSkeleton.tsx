export function VaultSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="vault-grid-container" style={{ padding: '0 48px 80px' }}>
      <div className="movie-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="movie-card-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              className="skeleton"
              style={{
                width: '100%',
                aspectRatio: '2/3',
                borderRadius: 10,
                animationDelay: `${i * 40}ms`,
                position: 'relative',
              }}
            >
              <div
                className="skeleton"
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 48,
                  height: 22,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
            </div>
            <div className="skeleton" style={{ height: 14, width: '85%', borderRadius: 4, animationDelay: `${i * 40 + 20}ms` }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 3, animationDelay: `${i * 40 + 40}ms` }} />
              <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 3, animationDelay: `${i * 40 + 60}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
