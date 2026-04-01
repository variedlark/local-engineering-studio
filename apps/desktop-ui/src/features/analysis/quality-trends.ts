export type QualitySnapshot = {
  at: number;
  score: number;
  drcViolations: number;
  routeSuccess: boolean;
  simulationStable: boolean;
};

export type QualityTrend = {
  delta: number;
  velocity: number;
  direction: "up" | "flat" | "down";
  confidence: number;
};

export type QualityForecastPoint = {
  step: number;
  projectedScore: number;
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, round(value)));
}

export function trendFromSnapshots(snapshots: QualitySnapshot[]): QualityTrend {
  if (snapshots.length < 2) {
    return {
      delta: 0,
      velocity: 0,
      direction: "flat",
      confidence: 0.2,
    };
  }

  const sorted = [...snapshots].sort((a, b) => a.at - b.at);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const delta = last.score - first.score;
  const spanMinutes = Math.max(1, (last.at - first.at) / 60000);
  const velocity = delta / spanMinutes;

  let direction: QualityTrend["direction"] = "flat";
  if (delta > 1.5) {
    direction = "up";
  } else if (delta < -1.5) {
    direction = "down";
  }

  const confidence = Math.min(1, Math.max(0.2, sorted.length / 12));

  return {
    delta: round(delta),
    velocity: round(velocity),
    direction,
    confidence: round(confidence),
  };
}

export function qualityForecast(
  snapshots: QualitySnapshot[],
  steps: number,
): QualityForecastPoint[] {
  const safeSteps = Math.max(1, Math.round(steps));
  if (snapshots.length === 0) {
    return Array.from({ length: safeSteps }, (_, index) => ({ step: index + 1, projectedScore: 0 }));
  }

  const trend = trendFromSnapshots(snapshots);
  const sorted = [...snapshots].sort((a, b) => a.at - b.at);
  const baseline = sorted[sorted.length - 1]!.score;

  return Array.from({ length: safeSteps }, (_, index) => {
    const step = index + 1;
    return {
      step,
      projectedScore: clampScore(baseline + trend.velocity * step * 5),
    };
  });
}

export function recommendQualityActions(snapshot: QualitySnapshot): string[] {
  const actions: string[] = [];
  if (snapshot.drcViolations > 0) {
    actions.push("Resolve DRC violations");
  }
  if (!snapshot.routeSuccess) {
    actions.push("Improve route endpoints and layout");
  }
  if (!snapshot.simulationStable) {
    actions.push("Tune simulation step and initial energy");
  }
  if (snapshot.score < 75) {
    actions.push("Run targeted quality iteration");
  }
  if (actions.length === 0) {
    actions.push("Maintain current quality baseline");
  }
  return actions;
}

export function movingAverageScores(snapshots: QualitySnapshot[], windowSize: number) {
  const safeWindow = Math.max(1, Math.round(windowSize));
  const sorted = [...snapshots].sort((a, b) => a.at - b.at);
  const values = sorted.map((snapshot) => snapshot.score);

  return values.map((_, index) => {
    const start = Math.max(0, index - safeWindow + 1);
    const window = values.slice(start, index + 1);
    const avg = window.reduce((sum, value) => sum + value, 0) / window.length;
    return clampScore(avg);
  });
}
