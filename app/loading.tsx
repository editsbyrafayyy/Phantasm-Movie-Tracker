export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: 280, height: 38, borderRadius: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 10, animationDelay: `${i * 60}ms` }} />
            <div className="skeleton" style={{ height: 14, width: '75%', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
