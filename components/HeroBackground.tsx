export default function HeroBackground() {
  return (
    <>
      {/* ── Hard-edged diagonal light beam from bottom-left ───────────────── */}
      {/* Outer beam — wide, very subtle fill */}
      <div
        aria-hidden="true"
        className="beam beam-outer"
      />
      {/* Inner beam — narrower, a touch brighter */}
      <div
        aria-hidden="true"
        className="beam beam-inner"
      />
      {/* Hot line — razor-thin bright centre stripe */}
      <div
        aria-hidden="true"
        className="beam beam-hotline"
      />

      {/* ── Concentric arc rings + orb — anchored at bottom-centre ──────────── */}
      <div
        aria-hidden="true"
        className="arcs-container"
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
