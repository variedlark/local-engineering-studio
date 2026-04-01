export type RecommendationSeverity = "info" | "warn" | "critical";

export type Recommendation = {
  id: string;
  title: string;
  detail: string;
  severity: RecommendationSeverity;
  tags: string[];
};

export type RecommendationInput = {
  drcViolations: number;
  qualityScore: number | null;
  routeStatus: string;
  simulationSummary: string;
  selectedCount: number;
  hasHealthReport: boolean;
  notesCount: number;
  pinnedNotesCount: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (input.drcViolations > 0) {
    recommendations.push({
      id: "drc",
      title: "Resolve DRC Violations",
      detail: `${input.drcViolations} violations detected. Fix spacing before committing layout changes.`,
      severity: input.drcViolations > 4 ? "critical" : "warn",
      tags: ["analysis", "drc", "quality"],
    });
  }

  if (input.qualityScore === null) {
    recommendations.push({
      id: "quality-stale",
      title: "Run Quality Suite",
      detail: "Quality score is stale. Execute full quality suite to re-establish baseline.",
      severity: "warn",
      tags: ["quality", "analysis"],
    });
  } else if (input.qualityScore < 75) {
    recommendations.push({
      id: "quality-low",
      title: "Improve Quality Score",
      detail: `Current quality score is ${input.qualityScore}/100. Prioritize route and simulation stability.`,
      severity: input.qualityScore < 60 ? "critical" : "warn",
      tags: ["quality", "route", "simulation"],
    });
  }

  const route = normalize(input.routeStatus);
  if (route.includes("fail") || route.includes("no route")) {
    recommendations.push({
      id: "route-fail",
      title: "Re-evaluate Routing Pair",
      detail: "Routing failed. Try alternate endpoints or adjust component placement/layers.",
      severity: "critical",
      tags: ["route", "layout"],
    });
  }

  const simulation = normalize(input.simulationSummary);
  if (simulation.includes("unstable")) {
    recommendations.push({
      id: "sim-unstable",
      title: "Tune Simulation Parameters",
      detail: "Simulation appears unstable. Reduce time step or review initial energy setup.",
      severity: "warn",
      tags: ["simulation", "stability"],
    });
  }

  if (input.selectedCount < 2) {
    recommendations.push({
      id: "selection",
      title: "Leverage Multi-select",
      detail: "Select at least two components to unlock align/distribute layout workflows.",
      severity: "info",
      tags: ["selection", "layout"],
    });
  }

  if (!input.hasHealthReport) {
    recommendations.push({
      id: "health",
      title: "Generate Health Report",
      detail: "Create a health report before export to capture state for review.",
      severity: "info",
      tags: ["report", "handoff"],
    });
  }

  if (input.notesCount === 0) {
    recommendations.push({
      id: "notes-none",
      title: "Capture Session Notes",
      detail: "No notes recorded. Track rationale to make review and handoff easier.",
      severity: "info",
      tags: ["notes", "documentation"],
    });
  } else if (input.pinnedNotesCount === 0) {
    recommendations.push({
      id: "notes-pin",
      title: "Pin Key Notes",
      detail: "Promote top-priority notes so they remain visible throughout the session.",
      severity: "info",
      tags: ["notes", "workflow"],
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "healthy",
      title: "System Healthy",
      detail: "No critical guidance right now. Continue iterating or prepare an export/checkpoint.",
      severity: "info",
      tags: ["healthy"],
    });
  }

  const severityRank: Record<RecommendationSeverity, number> = {
    critical: 0,
    warn: 1,
    info: 2,
  };

  recommendations.sort((a, b) => {
    const rank = severityRank[a.severity] - severityRank[b.severity];
    if (rank !== 0) {
      return rank;
    }
    return a.title.localeCompare(b.title);
  });

  return recommendations;
}
