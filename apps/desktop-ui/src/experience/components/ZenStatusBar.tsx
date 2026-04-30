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
    <div className="pointer-events-auto fixed bottom-0 left-0 right-0 flex min-h-[var(--les-status-height)] py-1 items-center justify-between border-t border-white/10 bg-[var(--les-surface-strong)]/70 px-4 text-[10px] font-mono text-white/50 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className={busy ? "text-white/70" : "text-white/40"}>{busy ? "Working" : "Idle"}</span>
        <span>{selectedCount} sel</span>
        <span>{viewMode.toUpperCase()}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em]">{routeStatus}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em]">{qualityLabel(qualityScore)}</span>
        <span>{simulationSummary}</span>
        <span>{snapEnabled ? "Snap On" : "Snap Off"}</span>
        <span>{(viewportZoom * 100).toFixed(0)}%</span>
        <span className="max-w-[240px] truncate text-right">{statusMessage}</span>
      </div>
    </div>
  );
});
