export default function Loading() {
  return (
    <div className="browse-page" style={{ minHeight: '100vh' }}>
      {/* ── Hero Carousel Banner Skeleton ────────────────────────── */}
      <div className="hero-carousel" style={{ background: '#0a0a0a', position: 'relative' }}>
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0, opacity: 0.3 }} />
        <div className="hero-content" style={{ position: 'absolute', bottom: 48, left: 48, right: 48, zIndex: 5 }}>
          {/* Eyebrow badge */}
          <div className="skeleton" style={{ width: 140, height: 20, borderRadius: 4, marginBottom: 14, animationDelay: '0ms' }} />
          {/* Title */}
          <div className="skeleton" style={{ width: 'clamp(280px, 50%, 640px)', height: 48, borderRadius: 6, marginBottom: 16, animationDelay: '60ms' }} />
          {/* Genre chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 90, height: 24, borderRadius: 12, animationDelay: '100ms' }} />
            <div className="skeleton" style={{ width: 75, height: 24, borderRadius: 12, animationDelay: '140ms' }} />
          </div>
          {/* Meta line */}
          <div className="skeleton" style={{ width: 220, height: 16, borderRadius: 4, marginBottom: 24, animationDelay: '180ms' }} />
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skeleton" style={{ width: 130, height: 42, borderRadius: 8, animationDelay: '220ms' }} />
            <div className="skeleton" style={{ width: 120, height: 42, borderRadius: 8, animationDelay: '260ms' }} />
          </div>
        </div>
      </div>

      {/* ── Recently Viewed Row Skeleton (110px x 165px cards) ───── */}
      <div style={{ padding: '0 48px', marginTop: 36, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: 140, height: 18, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 32, height: 18, borderRadius: 10 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 110, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ width: 110, height: 165, borderRadius: 8, animationDelay: `${i * 50}ms` }} />
              <div className="skeleton" style={{ width: '80%', height: 12, borderRadius: 3, animationDelay: `${i * 50 + 20}ms` }} />
              <div className="skeleton" style={{ width: '50%', height: 10, borderRadius: 3, animationDelay: `${i * 50 + 40}ms` }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Must Watch Row Skeleton ──────────────────────────────── */}
      <div style={{ padding: '0 48px', marginTop: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 150, height: 22, borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 170, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ width: 170, height: 255, borderRadius: 10, animationDelay: `${i * 60}ms` }} />
              <div className="skeleton" style={{ width: '85%', height: 14, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: '45%', height: 11, borderRadius: 3 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── From the Vault Heading & Filters Skeleton ─────────────── */}
      <div className="home-vault-section" style={{ padding: '0 48px', marginTop: 40 }}>
        <div className="skeleton" style={{ width: 180, height: 26, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 260, height: 14, borderRadius: 4, marginBottom: 20 }} />
      </div>

      <div className="home-vault-filters" style={{ padding: '0 48px', marginBottom: 32 }}>
        <div className="skeleton" style={{ flex: '1 1 320px', height: 42, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 160, height: 42, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 160, height: 42, borderRadius: 8 }} />
      </div>

      {/* Category Row Skeletons */}
      {[1, 2].map(row => (
        <div key={row} style={{ padding: '0 48px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="skeleton" style={{ width: 160, height: 20, borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 170, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ width: 170, height: 255, borderRadius: 10, animationDelay: `${(row * 6 + i) * 40}ms` }} />
                <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
