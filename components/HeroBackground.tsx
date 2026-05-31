export default function HeroBackground({ variant = 'home' }: { variant?: 'home' | 'add' | 'update' }) {
  // Flip the light beam depending on the page
  const beamStyle: React.CSSProperties = {
    transform: variant === 'add' ? 'scaleX(-1)' : variant === 'update' ? 'scaleY(-1)' : 'none',
  };

  // Move the concentric arcs depending on the page
  const arcsStyle: React.CSSProperties = {
    ...(variant === 'home' && { bottom: 0, left: '50%', transform: 'translateX(-50%)' }),
    ...(variant === 'add' && { top: '50%', right: '-20%', transform: 'translateY(-50%) rotate(-90deg)' }),
    ...(variant === 'update' && { top: 0, left: '50%', transform: 'translateX(-50%) rotate(180deg)' }),
  };

  return (
    <>
      {/* ── Soft cinematic light beam ───────────────────────────────────────── */}
      <svg
        className="hero-beam-svg"
        style={beamStyle}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="beam-grad-outer" x1="0%" y1="100%" x2="60%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="40%" stopColor="rgba(255, 255, 255, 0.01)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <linearGradient id="beam-grad-inner" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.02)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
          <linearGradient id="beam-grad-core" x1="0%" y1="100%" x2="45%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="60%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>

        {/* Outer wide soft spread */}
        <polygon points="0,100 0,35 90,0 25,0" fill="url(#beam-grad-outer)" />
        {/* Inner brighter spread */}
        <polygon points="0,100 0,60 65,0 40,0" fill="url(#beam-grad-inner)" />
        {/* Hot centre spine */}
        <polygon points="0,100 0,70 58,0 48,0" fill="url(#beam-grad-core)" style={{ mixBlendMode: 'screen' }} />
      </svg>

      {/* ── Concentric arc rings + orb ──────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="arcs-container"
        style={arcsStyle}
      >
        <svg
          className="arcs-svg"
          viewBox="-600 -520 1200 520"
          preserveAspectRatio="xMidYMax meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
        >
          {[90, 170, 260, 360, 465, 575, 690, 810].map((r, i) => (
            <circle
              key={i}
              cx={0}
              cy={0}
              r={r}
              stroke="rgba(255,255,255,0.045)"
              strokeWidth={1}
            />
          ))}
        </svg>

        {/* Glowing orb at arc origin */}
        <div className="arcs-orb" />
      </div>
    </>
  );
}
