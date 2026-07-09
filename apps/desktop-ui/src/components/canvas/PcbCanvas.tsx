import { memo, useMemo } from "react";
import type { Board, DrcViolation, ViewportState } from "../../lib/pcb-types";
import { formatCoordinate } from "../../lib/units";
import { BoardOutline } from "./BoardOutline";
import { Grid } from "./Grid";
import { LayerRenderer } from "./LayerRenderer";
import { SelectionOverlay } from "./SelectionOverlay";
import { ViewportControls } from "./ViewportControls";

type PcbCanvasProps = {
  board: Board | null;
  viewport: ViewportState;
  selectedComponentId: string | null;
  selectedViolation: DrcViolation | null;
  onSelectComponent: (componentId: string | null) => void;
  onCursorMove: (x: number, y: number) => void;
  onZoomBy: (factor: number) => void;
  onFitView: () => void;
};

export const PcbCanvas = memo(function PcbCanvas({
  board,
  viewport,
  selectedComponentId,
  selectedViolation,
  onSelectComponent,
  onCursorMove,
  onZoomBy,
  onFitView,
}: PcbCanvasProps) {
  const visibleLayerIds = useMemo(
    () =>
      new Set(
        board?.layers
          .filter((layer) => layer.visible)
          .map((layer) => layer.id) ?? [],
      ),
    [board?.layers],
  );
  const layerColor = useMemo(
    () => new Map(board?.layers.map((layer) => [layer.id, layer.color]) ?? []),
    [board?.layers],
  );
  const viewBox = useMemo(() => {
    if (!board) return "0 0 180 120";
    const margin = 10;
    return `${-margin} ${-margin} ${board.width + margin * 2} ${board.height + margin * 2}`;
  }, [board]);

  return (
    <section
      className="pcb-canvas-shell"
      aria-label="PCB canvas"
      onClick={() => onSelectComponent(null)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = board?.width ?? 180;
        const height = board?.height ?? 120;
        const x = ((event.clientX - rect.left) / rect.width) * width;
        const y = ((event.clientY - rect.top) / rect.height) * height;
        onCursorMove(x, y);
      }}
      onWheel={(event) => {
        event.preventDefault();
        onZoomBy(event.deltaY > 0 ? 0.92 : 1.08);
      }}
    >
      <div className="pcb-canvas-topline">
        <div className="canvas-info-group">
          <span className="canvas-board-name">{board ? board.name : "No board loaded"}</span>
          <span className="canvas-coordinates">
            {formatCoordinate(viewport.cursor.x, viewport.unit)} /{" "}
            {formatCoordinate(viewport.cursor.y, viewport.unit)}
          </span>
        </div>
        {selectedViolation ? (
          <span className={`canvas-drc-chip ${selectedViolation.severity}`}>
            {selectedViolation.rule}
          </span>
        ) : null}
      </div>
      <svg
        className="pcb-canvas"
        viewBox={viewBox}
        role="img"
        aria-label="Mock PCB layout with tracks, vias and components"
      >
        <Grid />
        {board ? (
          <g
            transform={`scale(${viewport.zoom}) translate(${viewport.offset.x} ${viewport.offset.y})`}
            className="canvas-content-group"
          >
            <BoardOutline board={board} />
            <LayerRenderer
              board={board}
              selectedComponentId={selectedComponentId}
              visibleLayerIds={visibleLayerIds}
              layerColor={layerColor}
              onSelectComponent={onSelectComponent}
            />
            <SelectionOverlay
              board={board}
              selectedComponentId={selectedComponentId}
              selectedViolation={selectedViolation}
            />
          </g>
        ) : (
          <g className="canvas-empty-state">
            <rect
              x="38"
              y="28"
              width="104"
              height="58"
              rx="4"
              fill="rgba(15,23,42,.4)"
              stroke="rgba(85,240,255,.2)"
              strokeDasharray="3 3"
            />
            <text x="90" y="55" textAnchor="middle" className="pcb-empty-label">
              Canvas Ready
            </text>
            <text x="90" y="65" textAnchor="middle" className="pcb-empty-sub">
              Load a project to begin designing
            </text>
          </g>
        )}
      </svg>
      <ViewportControls
        viewport={viewport}
        onZoomBy={onZoomBy}
        onFitView={onFitView}
      />
    </section>
  );
});
