export type SignalPoint = {
  t: number;
  value: number;
};

export type SignalAnalysis = {
  min: number;
  max: number;
  average: number;
  peakToPeak: number;
  slopeChanges: number;
  zeroCrossings: number;
  stabilityScore: number;
};

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function slopeChanges(points: SignalPoint[]) {
  if (points.length < 3) {
    return 0;
  }
  let changes = 0;
  for (let i = 2; i < points.length; i += 1) {
    const a = points[i - 2]!;
    const b = points[i - 1]!;
    const c = points[i]!;
    const slopeAB = b.value - a.value;
    const slopeBC = c.value - b.value;
    const signAB = Math.sign(slopeAB);
    const signBC = Math.sign(slopeBC);
    if (signAB !== 0 && signBC !== 0 && signAB !== signBC) {
      changes += 1;
    }
  }
  return changes;
}

function zeroCrossings(points: SignalPoint[]) {
  if (points.length < 2) {
    return 0;
  }
  let crossings = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!;
    const current = points[i]!;
    if ((prev.value < 0 && current.value > 0) || (prev.value > 0 && current.value < 0)) {
      crossings += 1;
    }
  }
  return crossings;
}

function stabilityScore(peakToPeak: number, slopeFlips: number, crossings: number) {
  let score = 100;
  score -= Math.min(40, Math.round(peakToPeak * 10));
  score -= Math.min(30, slopeFlips * 2);
  score -= Math.min(20, crossings);
  return Math.max(0, score);
}

export function analyzeSignal(points: SignalPoint[]): SignalAnalysis {
  if (points.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      peakToPeak: 0,
      slopeChanges: 0,
      zeroCrossings: 0,
      stabilityScore: 0,
    };
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = mean(values);
  const p2p = max - min;
  const flips = slopeChanges(points);
  const crossings = zeroCrossings(points);

  return {
    min: round3(min),
    max: round3(max),
    average: round3(avg),
    peakToPeak: round3(p2p),
    slopeChanges: flips,
    zeroCrossings: crossings,
    stabilityScore: stabilityScore(p2p, flips, crossings),
  };
}

export function summarizeSignal(analysis: SignalAnalysis) {
  return `Signal min ${analysis.min}, max ${analysis.max}, avg ${analysis.average}, stability ${analysis.stabilityScore}/100`;
}

export function compareSignals(primary: SignalPoint[], secondary: SignalPoint[]) {
  const a = analyzeSignal(primary);
  const b = analyzeSignal(secondary);
  return {
    better: a.stabilityScore >= b.stabilityScore ? "primary" : "secondary",
    primary: a,
    secondary: b,
    delta: a.stabilityScore - b.stabilityScore,
  };
}
