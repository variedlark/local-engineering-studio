export function Grid() {
  return (
    <>
      <defs>
        <pattern id="boardSubstrate" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="rgba(16,185,129,.08)" />
          <path d="M0 0 L6 6 M6 0 L0 6" stroke="rgba(57,217,138,.06)" strokeWidth=".15" />
        </pattern>
        <pattern id="majorGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="rgba(148,163,184,.16)"
            strokeWidth=".25"
          />
        </pattern>
        <pattern id="minorGrid" width="2" height="2" patternUnits="userSpaceOnUse">
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
      </defs>
      <rect width="100%" height="100%" fill="url(#minorGrid)" />
      <rect width="100%" height="100%" fill="url(#majorGrid)" />
    </>
  );
}
