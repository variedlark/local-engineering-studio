import {
  Box,
  Bug,
  Cpu,
  Download,
  Play,
  Redo2,
  Save,
  Undo2,
  Zap,
} from "lucide-react";
import type { PcbProject, WorkspaceMode } from "../../lib/pcb-types";

type TopBarProps = {
  project: PcbProject | null;
  activeMode: WorkspaceMode;
  onMode: (mode: WorkspaceMode) => void;
  onSave: () => void;
  onRunDrc: () => void;
};

export function TopBar({
  project,
  activeMode,
  onMode,
  onSave,
  onRunDrc,
}: TopBarProps) {
  const errorCount =
    project?.drc.filter((item) => item.severity === "error").length ?? 0;
  const warningCount =
    project?.drc.filter((item) => item.severity === "warning").length ?? 0;
  const unrouted =
    project?.nets.reduce(
      (total, net) => total + (net.unroutedLengthMm > 0 ? 1 : 0),
      0,
    ) ?? 0;
  return (
    <header className="studio-topbar">
      <div className="brand-lockup">
        <Box size={18} />
        <div>
          <strong>{project?.name ?? "Local Engineering Studio"}</strong>
          <span>
            {project
              ? `${project.path} · Rev ${project.revision}`
              : "Local-first PCB design workspace"}
          </span>
        </div>
      </div>
      <nav className="mode-switcher" aria-label="Workspace modes">
        {(
          [
            "schematic",
            "pcb",
            "3d",
            "simulation",
            "manufacturing",
          ] as WorkspaceMode[]
        ).map((mode) => (
          <button
            key={mode}
            type="button"
            className={activeMode === mode ? "active" : ""}
            onClick={() => onMode(mode)}
          >
            {mode}
          </button>
        ))}
      </nav>
      <div className="quick-actions">
        <button type="button" aria-label="Undo">
          <Undo2 size={15} />
        </button>
        <button type="button" aria-label="Redo">
          <Redo2 size={15} />
        </button>
        <button type="button" aria-label="Save" onClick={onSave}>
          <Save size={15} /> Save
        </button>
        <button type="button" aria-label="Export manufacturing">
          <Download size={15} /> Export
        </button>
        <button type="button" aria-label="Run DRC" onClick={onRunDrc}>
          <Bug size={15} /> DRC
        </button>
        <button type="button" aria-label="Simulate">
          <Play size={15} /> Simulate
        </button>
      </div>
      <div className="health-strip" aria-label="Design health indicators">
        <span className={errorCount > 0 ? "bad" : "good"}>
          <Zap size={13} /> {errorCount} errors
        </span>
        <span className={warningCount > 0 ? "warn" : "good"}>
          {warningCount} warnings
        </span>
        <span>{unrouted} unrouted</span>
        <span>
          <Cpu size={13} /> {project?.engineStatus ?? "offline"}
        </span>
        <span>{project?.savedState ?? "no project"}</span>
      </div>
    </header>
  );
}
