export const QUALITY_STALE_SUMMARY = "Stale after changes - run quality suite";

export function scoreQuality(args: {
  drcViolations: number;
  routeSuccess: boolean | null;
  simulationStable: boolean;
  componentCount: number;
}) {
  let score = 100;
  score -= Math.min(56, args.drcViolations * 8);
  if (args.routeSuccess === false) {
    score -= 18;
  }
  if (args.routeSuccess === null && args.componentCount >= 2) {
    score -= 8;
  }
  if (!args.simulationStable) {
    score -= 12;
  }
  if (args.drcViolations === 0 && args.routeSuccess === true && args.simulationStable) {
    score += 6;
  }
  return Math.max(0, Math.min(100, score));
}

export function qualitySummary(args: {
  score: number;
  drcViolations: number;
  routeSuccess: boolean | null;
  simulationStable: boolean;
}) {
  const routeText =
    args.routeSuccess === null ? "route skipped" : args.routeSuccess ? "route ok" : "route failed";
  const simText = args.simulationStable ? "simulation stable" : "simulation unstable";
  return `${args.score}/100 | ${args.drcViolations} drc violations | ${routeText} | ${simText}`;
}

export function staleQualityState() {
  return {
    qualityScore: null,
    qualitySummary: QUALITY_STALE_SUMMARY,
  };
}
