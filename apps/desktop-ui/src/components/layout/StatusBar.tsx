import type { PcbProject, ViewportState } from "../../lib/pcb-types";
import { formatCoordinate } from "../../lib/units";

type StatusBarProps = {
  project: PcbProject | null;
  viewport: ViewportState;
  activeLayer: string;
  onToggleSnap: () => void;
  onToggleUnit: () => void;
};

export function StatusBar({
  project,
  viewport,
  activeLayer,
  onToggleSnap,
  onToggleUnit,
}: StatusBarProps) {
  return (
    <footer className="studio-statusbar">
      <span>
        X {formatCoordinate(viewport.cursor.x, viewport.unit)} Y{" "}
        {formatCoordinate(viewport.cursor.y, viewport.unit)}
      </span>
      <button type="button" onClick={onToggleUnit}>
        {viewport.unit}
      </button>
      <span>Grid {viewport.gridMm} mm</span>
      <span>Layer {activeLayer}</span>
      <button type="button" onClick={onToggleSnap}>
        {viewport.snap ? "Snap On" : "Snap Off"}
      </button>
      <span>Zoom {Math.round(viewport.zoom * 100)}%</span>
      <span>DRC {project ? project.drc.length : "—"}</span>
      <span>{project?.savedState ?? "No workspace"}</span>
    </footer>
  );
}
