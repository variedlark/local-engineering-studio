import { memo } from "react";

type ZenStatusBarProps = {
  statusMessage: string;
  busy: boolean;
  routeStatus: string;
  simulationSummary: string;
  qualityScore: number | null;
  viewportZoom: number;
  snapEnabled: boolean;
  selectedCount: number;
  viewMode: "2d" | "3d";
};

function qualityLabel(score: number | null) {
  if (score === null) {
    return "Quality --";
  }
  return `Quality ${score}/100`;
}

export const ZenStatusBar = memo(function ZenStatusBar({
  statusMessage,
  busy,
  routeStatus,
  simulationSummary,
  qualityScore,
  viewportZoom,
  snapEnabled,
  selectedCount,
  viewMode,
}: ZenStatusBarProps) {
  return (
    <div className="zen-status-bar pointer-events-auto fixed bottom-0 left-0 right-0 z-30 flex h-[var(--les-status-height)] items-center justify-between px-4 text-[10px] font-mono text-white/50">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <span className={busy ? "text-white/70" : "text-white/40"}>{busy ? "Working" : "Idle"}</span>
        <span>{selectedCount} sel</span>
        <span>{viewMode.toUpperCase()}</span>
        <span>{routeStatus}</span>
      </div>
      <div className="hidden items-center gap-3 md:flex md:gap-4">
        <span>{qualityLabel(qualityScore)}</span>
        <span>{simulationSummary}</span>
        <span>{snapEnabled ? "Snap On" : "Snap Off"}</span>
        <span>{(viewportZoom * 100).toFixed(0)}%</span>
        <span className="max-w-[240px] truncate text-right">{statusMessage}</span>
      </div>
    </div>
  );
});
