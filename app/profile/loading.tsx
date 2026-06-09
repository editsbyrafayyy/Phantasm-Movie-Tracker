export default function ProfileLoading() {
  return (
    <div className="profile-page page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ maxWidth: 560, margin: '0 auto 48px auto' }}>
        <header className="form-header">
          <div className="skeleton h-4 w-12 mb-2" />
          <div className="skeleton h-10 w-32" />
        </header>

        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            {/* Avatar Circle Skeleton */}
            <div className="skeleton rounded-full" style={{ width: 64, height: 64, flexShrink: 0 }} />
            
            <div style={{ flex: 1 }}>
              <div className="skeleton h-8 w-48 mb-3" />
              <div className="flex gap-4">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-4 w-32" />
              </div>
            </div>
          </div>

          <div className="skeleton h-32 w-full mb-6" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>

      <div className="profile-stats-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 48, marginTop: 16 }}>
        <div className="skeleton h-24 w-full mb-8" />
        
        <div className="stats-charts-grid">
          <div className="skeleton h-80 w-full" />
          <div className="skeleton h-80 w-full" />
          <div className="skeleton h-80 w-full" />
          <div className="skeleton h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
