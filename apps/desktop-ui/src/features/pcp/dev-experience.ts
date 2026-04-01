export type ModuleComplexity = {
  file: string;
  functions: number;
  branches: number;
  lines: number;
};

export type ComplexityReport = {
  modules: ModuleComplexity[];
  averageComplexity: number;
  hotspots: ModuleComplexity[];
};

export type WorkloadProfile = {
  contributors: number;
  weeklyCommits: number;
  avgReviewTimeHours: number;
};

export type DevExScore = {
  score: number;
  factors: {
    complexity: number;
    velocity: number;
    reviewCycle: number;
  };
};

function complexityWeight(module: ModuleComplexity) {
  return module.functions * 1.4 + module.branches * 2 + module.lines / 40;
}

export function analyzeComplexity(modules: ModuleComplexity[]): ComplexityReport {
  if (modules.length === 0) {
    return {
      modules,
      averageComplexity: 0,
      hotspots: [],
    };
  }
  const values = modules.map((module) => complexityWeight(module));
  const averageComplexity = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  const hotspots = modules
    .filter((module) => complexityWeight(module) > averageComplexity * 1.4)
    .sort((a, b) => complexityWeight(b) - complexityWeight(a));
  return {
    modules,
    averageComplexity,
    hotspots,
  };
}

export function computeDevExScore(
  report: ComplexityReport,
  profile: WorkloadProfile,
): DevExScore {
  const complexityFactor = Math.max(0, 100 - report.averageComplexity);
  const velocityFactor = Math.min(100, Math.max(0, profile.weeklyCommits * 3));
  const reviewFactor = Math.max(0, 100 - profile.avgReviewTimeHours * 5);
  const score = Math.round((complexityFactor * 0.45 + velocityFactor * 0.25 + reviewFactor * 0.3) * 100) / 100;
  return {
    score,
    factors: {
      complexity: Math.round(complexityFactor * 100) / 100,
      velocity: Math.round(velocityFactor * 100) / 100,
      reviewCycle: Math.round(reviewFactor * 100) / 100,
    },
  };
}

export function suggestRefactorTargets(report: ComplexityReport) {
  return report.hotspots.map((module) => ({
    file: module.file,
    recommendation:
      module.lines > 500
        ? "Split module into slices"
        : module.branches > 30
          ? "Reduce branching with strategy handlers"
          : "Extract focused helpers",
  }));
}
