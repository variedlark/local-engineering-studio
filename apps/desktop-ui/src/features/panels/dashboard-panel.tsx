import type { ActivityEvent, HealthReport } from "../ui-store.types";
import { computeActivityPulse, computeDashboardMetrics } from "../dashboard-metrics";

type DashboardPanelProps = {
  projectName: string;
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

function toneClass(tone: "neutral" | "good" | "warn" | "critical") {
  if (tone === "good") {
    return "metric-tone-good";
  }
  if (tone === "warn") {
    return "metric-tone-warn";
  }
  if (tone === "critical") {
    return "metric-tone-critical";
  }
  return "metric-tone-neutral";
}

export function DashboardPanel({
  projectName,
  revision,
  componentCount,
  netCount,
  selectedCount,
  drcViolations,
  routeStatus,
  simulationSummary,
  qualityScore,
  qualitySummary,
  healthReport,
  activityEvents,
}: DashboardPanelProps) {
  const metrics = computeDashboardMetrics({
    revision,
    componentCount,
    netCount,
    selectedCount,
    drcViolations,
    routeStatus,
    simulationSummary,
    qualityScore,
    qualitySummary,
    healthReport,
    activityEvents,
  });

  const pulse = computeActivityPulse(activityEvents);

  return (
    <section className="stack dashboard-panel">
      <div className="panel-heading">
        <h2 className="panel-title">Command Deck</h2>
        <span className="dashboard-project-label">{projectName}</span>
      </div>

      <div className="dashboard-hero">
        <div>
          <strong>Session Overview</strong>
          <p>Revision {revision} tracking live analysis and editing signals.</p>
        </div>
        <div className="dashboard-hero-meta">
          <span>{componentCount} components</span>
          <span>{netCount} nets</span>
          <span>{selectedCount} selected</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {metrics.map((metric) => (
          <article className={`dashboard-card ${toneClass(metric.tone)}`} key={metric.id}>
            <span className="dashboard-card-label">{metric.label}</span>
            <strong className="dashboard-card-value">{metric.value}</strong>
            <p className="dashboard-card-detail">{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-pulse">
        <strong>Activity Pulse</strong>
        <div className="dashboard-pulse-row">
          {pulse.byKind.length === 0 ? (
            <span className="dashboard-pill">No activity yet</span>
          ) : (
            pulse.byKind.slice(0, 5).map((entry) => (
              <span className="dashboard-pill" key={entry.kind}>
                {entry.kind}: {entry.count}
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
