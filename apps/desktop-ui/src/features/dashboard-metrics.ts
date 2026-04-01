import type { ActivityEvent, HealthReport } from "./ui-store.types";

export type DashboardMetricsInput = {
  revision: number;
  componentCount: number;
  netCount: number;
  selectedCount: number;
  drcViolations: number;
  routeStatus: string;
  simulationSummary: string;
  qualityScore: number | null;
  qualitySummary: string;
  healthReport: HealthReport | null;
  activityEvents: ActivityEvent[];
};

export type DashboardMetricCard = {
  id: string;
  label: string;
  value: string;
  tone: "neutral" | "good" | "warn" | "critical";
  detail: string;
};

export type ActivityPulse = {
  total: number;
  byKind: Array<{ kind: ActivityEvent["kind"]; count: number }>;
  latest: ActivityEvent | null;
};

function qualityTone(score: number | null) {
  if (score === null) {
    return "warn" as const;
  }
  if (score >= 90) {
    return "good" as const;
  }
  if (score >= 70) {
    return "warn" as const;
  }
  return "critical" as const;
}

function routeTone(routeStatus: string) {
  const text = routeStatus.toLowerCase();
  if (text.includes("ok") || text.includes("succeeded") || text.includes("path length")) {
    return "good" as const;
  }
  if (text.includes("fail") || text.includes("no route")) {
    return "critical" as const;
  }
  return "warn" as const;
}

function simulationTone(summary: string) {
  const text = summary.toLowerCase();
  if (text.includes("stable")) {
    return "good" as const;
  }
  if (text.includes("unstable")) {
    return "critical" as const;
  }
  return "warn" as const;
}

export function computeActivityPulse(events: ActivityEvent[]): ActivityPulse {
  const byKindMap = new Map<ActivityEvent["kind"], number>();
  for (const event of events) {
    byKindMap.set(event.kind, (byKindMap.get(event.kind) ?? 0) + 1);
  }

  const byKind = Array.from(byKindMap.entries())
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: events.length,
    byKind,
    latest: events[0] ?? null,
  };
}

export function computeDashboardMetrics(input: DashboardMetricsInput): DashboardMetricCard[] {
  const pulse = computeActivityPulse(input.activityEvents);
  const latestText = pulse.latest ? `${pulse.latest.title} (${pulse.latest.kind})` : "No events";

  return [
    {
      id: "revision",
      label: "Revision",
      value: `r${input.revision}`,
      tone: "neutral",
      detail: `${input.componentCount} components, ${input.netCount} nets`,
    },
    {
      id: "selection",
      label: "Selection",
      value: `${input.selectedCount}`,
      tone: input.selectedCount > 0 ? "good" : "neutral",
      detail: input.selectedCount > 1 ? "Multi-select active" : "Single or none",
    },
    {
      id: "drc",
      label: "DRC",
      value: `${input.drcViolations}`,
      tone: input.drcViolations === 0 ? "good" : input.drcViolations < 4 ? "warn" : "critical",
      detail: input.drcViolations === 0 ? "No violations" : "Violations pending",
    },
    {
      id: "route",
      label: "Route",
      value: input.routeStatus,
      tone: routeTone(input.routeStatus),
      detail: "Current route analysis status",
    },
    {
      id: "simulation",
      label: "Simulation",
      value: input.simulationSummary,
      tone: simulationTone(input.simulationSummary),
      detail: "Latest simulation summary",
    },
    {
      id: "quality",
      label: "Quality",
      value: input.qualityScore === null ? "Pending" : `${input.qualityScore}/100`,
      tone: qualityTone(input.qualityScore),
      detail: input.qualitySummary,
    },
    {
      id: "health",
      label: "Health",
      value: input.healthReport ? "Available" : "Not generated",
      tone: input.healthReport ? "good" : "warn",
      detail: input.healthReport?.summary ?? "Generate report for detailed snapshot",
    },
    {
      id: "activity",
      label: "Activity",
      value: `${pulse.total}`,
      tone: pulse.total > 0 ? "good" : "neutral",
      detail: latestText,
    },
  ];
}

export function computeSelectionCentroid(
  selectedIds: string[],
  components: Array<{ id: string; x: number; y: number }>,
) {
  if (selectedIds.length === 0) {
    return null;
  }
  const selected = components.filter((component) => selectedIds.includes(component.id));
  if (selected.length === 0) {
    return null;
  }
  const sum = selected.reduce(
    (acc, component) => ({ x: acc.x + component.x, y: acc.y + component.y }),
    { x: 0, y: 0 },
  );
  return {
    x: Math.round(sum.x / selected.length),
    y: Math.round(sum.y / selected.length),
  };
}
