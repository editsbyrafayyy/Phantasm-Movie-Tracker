export default function Loading() {
  return (
    <div className="watch-page">
      <div className="watch-layout">
        
        {/* Left Column: Player & Sources */}
        <div className="watch-player-col" style={{ padding: '24px' }}>
          {/* Header Row */}
          <div className="watch-back-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="h-6 w-8 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-6 w-48 bg-white/[0.05] rounded animate-pulse" />
          </div>

          {/* 16:9 Video Player Wrap */}
          <div 
            className="watch-iframe-container bg-white/[0.03] animate-pulse" 
            style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}
          />

          {/* Under player controls */}
          <div className="watch-actions-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
            <div>
              <div className="h-3 w-24 bg-white/[0.05] rounded animate-pulse mb-2" />
              <div className="h-6 w-64 bg-white/[0.05] rounded animate-pulse" />
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="h-10 w-10 bg-white/[0.05] rounded-lg animate-pulse" />
              <div className="h-10 w-10 bg-white/[0.05] rounded-lg animate-pulse" />
            </div>
          </div>

          <div className="h-12 w-full bg-white/[0.04] rounded-lg animate-pulse mb-6" />

          {/* Server provider grid */}
          <div className="watch-server-grid-container" style={{ marginBottom: 24 }}>
            <div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse mb-3" />
            <div className="watch-server-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 w-full bg-white/[0.04] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="watch-sidebar" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Poster & metadata */}
          <div className="watch-sidebar-poster-card" style={{ display: 'flex', gap: 16 }}>
            <div className="w-[90px] h-[130px] bg-white/[0.05] rounded-lg flex-shrink-0 animate-pulse" />
            <div className="watch-sidebar-meta" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', flex: 1 }}>
              <div className="h-3 w-3/4 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-3 w-full bg-white/[0.05] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/[0.05] rounded animate-pulse" />
            </div>
          </div>

          <div>
            <div className="h-6 w-full bg-white/[0.05] rounded animate-pulse mb-2" />
            <div className="h-4 w-16 bg-white/[0.05] rounded animate-pulse" />
          </div>

          <div className="h-24 w-full bg-white/[0.04] rounded-lg animate-pulse" />

          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 w-16 bg-white/[0.05] rounded-md animate-pulse" />
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <div className="h-4 w-24 bg-white/[0.05] rounded animate-pulse mb-3" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="h-9 w-9 rounded-full bg-white/[0.05] flex-shrink-0 animate-pulse" />
                  <div style={{ flex: 1 }}>
                    <div className="h-3 w-20 bg-white/[0.05] rounded animate-pulse mb-2" />
                    <div className="h-2 w-24 bg-white/[0.05] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
