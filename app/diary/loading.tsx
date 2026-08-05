export default function DiaryLoading() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '100px 24px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 220, height: 36, borderRadius: 8 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 90, borderRadius: 14, width: '100%' }}
          />
        ))}
      </div>
    </div>
  );
}
