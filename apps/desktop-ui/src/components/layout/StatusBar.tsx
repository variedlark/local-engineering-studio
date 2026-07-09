import { MousePointer2, Layers, Grid, ZoomIn, CheckCircle2, AlertCircle } from "lucide-react";
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
      <div className="status-group">
        <MousePointer2 size={12} />
        <span>
          X {formatCoordinate(viewport.cursor.x, viewport.unit)} Y{" "}
          {formatCoordinate(viewport.cursor.y, viewport.unit)}
        </span>
        <button type="button" onClick={onToggleUnit} className="unit-toggle">
          {viewport.unit}
        </button>
      </div>

      <div className="status-group">
        <Grid size={12} />
        <span>Grid {viewport.gridMm} mm</span>
        <button type="button" onClick={onToggleSnap} className={viewport.snap ? "active" : ""}>
          {viewport.snap ? "Snap: On" : "Snap: Off"}
        </button>
      </div>

      <div className="status-group">
        <Layers size={12} />
        <span>Layer: {activeLayer}</span>
      </div>

      <div className="status-group">
        <ZoomIn size={12} />
        <span>{Math.round(viewport.zoom * 100)}%</span>
      </div>

      <div className="status-group push-right">
        {project ? (
          <>
            <div className="status-indicator">
              <AlertCircle size={12} className={project.drc.length > 0 ? "text-warn" : "text-good"} />
              <span>DRC: {project.drc.length}</span>
            </div>
            <div className="status-indicator">
              <CheckCircle2 size={12} className={project.savedState === "saved" ? "text-good" : "text-warn"} />
              <span className="text-capitalize">{project.savedState}</span>
            </div>
          </>
        ) : (
          <span>No active project</span>
        )}
      </div>
    </footer>
  );
}
