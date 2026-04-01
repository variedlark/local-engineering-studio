type StatusBarProps = {
  statusMessage: string;
  revision: number;
  dirty: boolean;
  busy: boolean;
  componentCount: number;
  routeStatus: string;
  simulationSummary: string;
  qualityScore: number | null;
  qualitySummary: string;
  viewportZoom: number;
  snapEnabled: boolean;
  selectedCount: number;
  showShortcutHint: boolean;
  shortcutHint: string;
};

function compact(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function qualityTone(score: number | null) {
  if (score === null) {
    return "status-chip-warn";
  }
  if (score >= 90) {
    return "status-chip-good";
  }
  if (score >= 70) {
    return "status-chip-warn";
  }
  return "status-chip-critical";
}

function routeTone(routeStatus: string) {
  const text = routeStatus.toLowerCase();
  if (text.includes("ok") || text.includes("succeeded") || text.includes("path")) {
    return "status-chip-good";
  }
  if (text.includes("fail") || text.includes("no route")) {
    return "status-chip-critical";
  }
  return "status-chip-neutral";
}

export function StatusBar({
  statusMessage,
  revision,
  dirty,
  busy,
  componentCount,
  routeStatus,
  simulationSummary,
  qualityScore,
  qualitySummary,
  viewportZoom,
  snapEnabled,
  selectedCount,
  showShortcutHint,
  shortcutHint,
}: StatusBarProps) {
  const simCompact = compact(simulationSummary, 54);
  const qualityLabel = qualityScore === null ? qualitySummary : `${qualityScore}/100`;

  return (
    <div className="statusbar">
      <div className="statusbar-primary">
        <span className="status-chip status-chip-neutral">r{revision}</span>
        <span className={`status-chip ${busy ? "status-chip-warn" : "status-chip-good"}`}>
          {busy ? "Working" : "Idle"}
        </span>
        <span className={`status-chip ${dirty ? "status-chip-warn" : "status-chip-good"}`}>
          {dirty ? "Unsaved" : "Saved"}
        </span>
        <span className="status-chip status-chip-neutral">Components {componentCount}</span>
        <span className="status-chip status-chip-neutral">Selected {selectedCount}</span>
      </div>

      <div className="statusbar-secondary">
        <span className={`status-chip ${routeTone(routeStatus)}`}>Route {compact(routeStatus, 28)}</span>
        <span className="status-chip status-chip-neutral">Simulation {compact(simCompact, 32)}</span>
        <span className={`status-chip ${qualityTone(qualityScore)}`}>Quality {qualityLabel}</span>
        <span className="status-chip status-chip-neutral">Zoom {(viewportZoom * 100).toFixed(0)}%</span>
        <span className="status-chip status-chip-neutral">Snap {snapEnabled ? "On" : "Off"}</span>
      </div>

      <div className="statusbar-message">
        <span>{statusMessage}</span>
        {showShortcutHint ? <span className="statusbar-shortcuts">{shortcutHint}</span> : null}
      </div>
    </div>
  );
}
