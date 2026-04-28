import { memo } from "react";

type AnalysisHudProps = {
  drcViolations: number;
  routeStatus: string;
  simulationSummary: string;
  qualityScore: number | null;
  onRunDrc: () => void;
  onRunRoute: () => void;
  onRunSimulation: () => void;
  onRunQualitySuite: () => void;
};

function scoreLabel(score: number | null) {
  if (score === null) {
    return "Pending";
  }
  return `${score}/100`;
}

export const AnalysisHud = memo(function AnalysisHud({
  drcViolations,
  routeStatus,
  simulationSummary,
  qualityScore,
  onRunDrc,
  onRunRoute,
  onRunSimulation,
  onRunQualitySuite,
}: AnalysisHudProps) {
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2 text-xs text-white/60">
        <div className="flex items-center justify-between">
          <span>DRC</span>
          <span className="font-mono text-white/80">{drcViolations} issues</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Route</span>
          <span className="font-mono text-white/80">{routeStatus}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Simulation</span>
          <span className="font-mono text-white/80">{simulationSummary}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Quality</span>
          <span className="font-mono text-white/80">{scoreLabel(qualityScore)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
        <button
          type="button"
          onClick={onRunDrc}
          className="rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          DRC
        </button>
        <button
          type="button"
          onClick={onRunRoute}
          className="rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          Route
        </button>
        <button
          type="button"
          onClick={onRunSimulation}
          className="rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          Sim
        </button>
        <button
          type="button"
          onClick={onRunQualitySuite}
          className="rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          Quality
        </button>
      </div>
    </div>
  );
});
