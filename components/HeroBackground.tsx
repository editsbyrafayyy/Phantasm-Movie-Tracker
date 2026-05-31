export default function HeroBackground() {
  return (
    <>
      {/* Diagonal light beam from bottom-left */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          width:      '65vw',
          height:     '80vh',
          background: 'linear-gradient(38deg, rgba(255,255,255,0.065) 0%, transparent 55%)',
          filter:     'blur(36px)',
          pointerEvents: 'none',
          zIndex:     1,
        }}
      />

      {/* Concentric arc rings + orb — centred at bottom */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          bottom:        0,
          left:          '50%',
          transform:     'translateX(-50%)',
          pointerEvents: 'none',
          zIndex:        1,
        }}
      >
        <svg
          width="800"
          height="420"
          viewBox="-400 -420 800 420"
          overflow="visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[100, 180, 270, 365, 470].map((r, i) => (
            <circle
              key={i}
              cx={0}
              cy={0}
              r={r}
              stroke="rgba(255,255,255,0.055)"
              strokeWidth={1}
            />
          ))}
        </svg>

        {/* Glowing orb at arc origin */}
        <div
          style={{
            position:    'absolute',
            bottom:      0,
            left:        '50%',
            transform:   'translate(-50%, 50%)',
            width:       10,
            height:      10,
            borderRadius: '50%',
            background:  '#ffffff',
            boxShadow:   '0 0 24px 10px rgba(255,255,255,0.28), 0 0 6px 2px rgba(255,255,255,0.7)',
          }}
        />
      </div>
    </>
  );
}
