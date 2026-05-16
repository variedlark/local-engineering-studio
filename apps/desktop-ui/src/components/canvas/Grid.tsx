export function Grid() {
  return (
    <>
      <defs>
        <pattern
          id="majorGrid"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="rgba(148,163,184,.16)"
            strokeWidth=".25"
          />
        </pattern>
        <pattern
          id="minorGrid"
          width="2"
          height="2"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 2 0 L 0 0 0 2"
            fill="none"
            stroke="rgba(148,163,184,.07)"
            strokeWidth=".15"
          />
        </pattern>
        <filter id="selectionGlow">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="1.5"
            floodColor="#55f0ff"
            floodOpacity="0.9"
          />
        </filter>
        <linearGradient id="boardSubstrate" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(16,185,129,.18)" />
          <stop offset="100%" stopColor="rgba(8,47,73,.14)" />
        </linearGradient>
      </defs>
      <rect width="180" height="120" fill="url(#minorGrid)" />
      <rect width="180" height="120" fill="url(#majorGrid)" />
    </>
  );
}
