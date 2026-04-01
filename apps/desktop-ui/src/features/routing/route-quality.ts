export type RoutePoint = { x: number; y: number };

export type RouteQualityReport = {
  segmentCount: number;
  manhattanLength: number;
  bendCount: number;
  selfCrossings: number;
  score: number;
  summary: string;
};

function segmentKey(a: RoutePoint, b: RoutePoint) {
  return `${a.x},${a.y}:${b.x},${b.y}`;
}

function normalizeSegmentKey(a: RoutePoint, b: RoutePoint) {
  const forward = segmentKey(a, b);
  const backward = segmentKey(b, a);
  return forward < backward ? forward : backward;
}

function manhattanLength(path: RoutePoint[]) {
  if (path.length < 2) {
    return 0;
  }
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    const prev = path[i - 1]!;
    const current = path[i]!;
    total += Math.abs(current.x - prev.x) + Math.abs(current.y - prev.y);
  }
  return total;
}

function bendCount(path: RoutePoint[]) {
  if (path.length < 3) {
    return 0;
  }
  let bends = 0;
  for (let i = 2; i < path.length; i += 1) {
    const a = path[i - 2]!;
    const b = path[i - 1]!;
    const c = path[i]!;
    const dx1 = b.x - a.x;
    const dy1 = b.y - a.y;
    const dx2 = c.x - b.x;
    const dy2 = c.y - b.y;
    if ((dx1 !== 0 && dy2 !== 0) || (dy1 !== 0 && dx2 !== 0)) {
      bends += 1;
    }
  }
  return bends;
}

function selfCrossings(path: RoutePoint[]) {
  const visitedSegments = new Set<string>();
  let crossings = 0;

  for (let i = 1; i < path.length; i += 1) {
    const prev = path[i - 1]!;
    const current = path[i]!;
    const key = normalizeSegmentKey(prev, current);
    if (visitedSegments.has(key)) {
      crossings += 1;
    } else {
      visitedSegments.add(key);
    }
  }

  return crossings;
}

function scoreRoute(length: number, bends: number, crossings: number) {
  let score = 100;
  score -= Math.min(30, Math.round(length / 40));
  score -= Math.min(30, bends * 4);
  score -= Math.min(35, crossings * 12);
  return Math.max(0, score);
}

export function evaluateRouteQuality(path: RoutePoint[]): RouteQualityReport {
  const segmentCount = Math.max(0, path.length - 1);
  const length = manhattanLength(path);
  const bends = bendCount(path);
  const crossings = selfCrossings(path);
  const score = scoreRoute(length, bends, crossings);
  const summary = `Route score ${score}/100 | segments ${segmentCount} | bends ${bends} | crossings ${crossings}`;

  return {
    segmentCount,
    manhattanLength: length,
    bendCount: bends,
    selfCrossings: crossings,
    score,
    summary,
  };
}

export function classifyRouteQuality(score: number) {
  if (score >= 85) {
    return "excellent" as const;
  }
  if (score >= 70) {
    return "good" as const;
  }
  if (score >= 50) {
    return "fair" as const;
  }
  return "poor" as const;
}

export function compareRoutes(primary: RoutePoint[], secondary: RoutePoint[]) {
  const a = evaluateRouteQuality(primary);
  const b = evaluateRouteQuality(secondary);
  return {
    better: a.score >= b.score ? "primary" : "secondary",
    scoreDelta: a.score - b.score,
    primary: a,
    secondary: b,
  };
}
