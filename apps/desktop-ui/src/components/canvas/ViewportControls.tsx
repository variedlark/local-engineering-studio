import type { ViewportState } from "../../lib/pcb-types";

type ViewportControlsProps = {
  viewport: ViewportState;
  onZoomBy: (factor: number) => void;
  onFitView: () => void;
};

export function ViewportControls({
  viewport,
  onZoomBy,
  onFitView,
}: ViewportControlsProps) {
  return (
    <div className="viewport-controls" aria-label="Viewport controls">
      <button type="button" onClick={() => onZoomBy(0.9)} aria-label="Zoom out">
        −
      </button>
      <span>{Math.round(viewport.zoom * 100)}%</span>
      <button type="button" onClick={() => onZoomBy(1.1)} aria-label="Zoom in">
        +
      </button>
      <button type="button" onClick={onFitView}>
        Fit
      </button>
      <span>Grid {viewport.gridMm} mm</span>
      <span>{viewport.snap ? "Snap on" : "Snap off"}</span>
    </div>
  );
}
