import { useMemo, useRef, useState } from "react";
import { computeSelectionCentroid } from "../features/dashboard-metrics";

type CanvasViewportProps = {
  onPlaceComponent: () => void;
  onMoveComponent: (componentId: string, x: number, y: number) => void;
  onMoveSelectedBy: (dx: number, dy: number) => void;
  onSelectComponent: (componentId: string | null) => void;
  onToggleComponentSelection: (componentId: string) => void;
  onClearSelection: () => void;
  onPanBy: (dx: number, dy: number) => void;
  onZoomBy: (factor: number) => void;
  onResetViewport: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  viewport: {
    offsetX: number;
    offsetY: number;
    zoom: number;
    showGrid: boolean;
    snapToGrid: boolean;
  };
  components: Array<{ id: string; name: string; x: number; y: number; layer: number }>;
  selectedComponentIds: string[];
  componentCount: number;
  routeStatus: string;
  routePath: Array<{ x: number; y: number }>;
  simulationSummary: string;
  selectedComponentName: string;
  onCenterSelection: () => void;
  onFitAll: () => void;
};

type DragState = {
  id: string;
  originX: number;
  originY: number;
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
};

function routeLength(routePath: Array<{ x: number; y: number }>) {
  if (routePath.length < 2) {
    return 0;
  }
  let total = 0;
  for (let i = 1; i < routePath.length; i += 1) {
    const previous = routePath[i - 1];
    const current = routePath[i];
    total += Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y);
  }
  return total;
}

function selectionBounds(components: Array<{ id: string; x: number; y: number }>, selectedIds: string[]) {
  if (selectedIds.length === 0) {
    return null;
  }
  const selectedSet = new Set(selectedIds);
  const selected = components.filter((component) => selectedSet.has(component.id));
  if (selected.length === 0) {
    return null;
  }
  const xs = selected.map((component) => component.x);
  const ys = selected.map((component) => component.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function gridLines(enabled: boolean) {
  if (!enabled) {
    return null;
  }
  const vertical = Array.from({ length: 20 }, (_, index) => (
    <line
      key={`grid-v-${index}`}
      x1={index * 50}
      x2={index * 50}
      y1={0}
      y2={700}
      stroke="var(--border)"
      strokeOpacity="0.35"
      strokeWidth="1"
    />
  ));
  const horizontal = Array.from({ length: 14 }, (_, index) => (
    <line
      key={`grid-h-${index}`}
      x1={0}
      x2={1000}
      y1={index * 50}
      y2={index * 50}
      stroke="var(--border)"
      strokeOpacity="0.35"
      strokeWidth="1"
    />
  ));
  return (
    <>
      {vertical}
      {horizontal}
    </>
  );
}

export function CanvasViewport({
  onPlaceComponent,
  onMoveComponent,
  onMoveSelectedBy,
  onSelectComponent,
  onToggleComponentSelection,
  onClearSelection,
  onPanBy,
  onZoomBy,
  onResetViewport,
  onToggleGrid,
  onToggleSnap,
  viewport,
  components,
  selectedComponentIds,
  componentCount,
  routeStatus,
  routePath,
  simulationSummary,
  selectedComponentName,
  onCenterSelection,
  onFitAll,
}: CanvasViewportProps) {
  const draggingNodeRef = useRef<DragState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const routePreview = routePath
    .slice(0, 6)
    .map((point) => `${point.x},${point.y}`)
    .join(" -> ");
  const routeDistance = routeLength(routePath);
  const centroid = computeSelectionCentroid(selectedComponentIds, components);
  const bounds = selectionBounds(components, selectedComponentIds);
  const selectedSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);
  const sortedLayers = useMemo(
    () => Array.from(new Set(components.map((component) => component.layer))).sort((a, b) => a - b),
    [components],
  );

  const pointRadius = 9;

  return (
    <div
      className="canvas-surface"
      role="img"
      aria-label="Design canvas viewport"
      onDoubleClick={() => onSelectComponent(null)}
      onWheel={(event) => {
        event.preventDefault();
        onZoomBy(event.deltaY > 0 ? 0.92 : 1.08);
      }}
    >
      <svg className="canvas-scene" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
        {gridLines(viewport.showGrid)}

        <g transform={`translate(${viewport.offsetX} ${viewport.offsetY}) scale(${viewport.zoom})`}>
          {routePath.length > 1 ? (
            <polyline
              fill="none"
              points={routePath.map((point) => `${point.x},${point.y}`).join(" ")}
              stroke="var(--accent)"
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeWidth={8}
            />
          ) : null}

          {bounds ? (
            <rect
              className="selection-bounds"
              height={Math.max(1, bounds.maxY - bounds.minY + 12)}
              width={Math.max(1, bounds.maxX - bounds.minX + 12)}
              x={bounds.minX - 6}
              y={bounds.minY - 6}
            />
          ) : null}

          {components.map((component) => {
            const selected = selectedSet.has(component.id);
            const hovered = hoveredId === component.id;
            return (
              <g key={component.id} transform={`translate(${component.x} ${component.y})`}>
                <circle
                  className={selected ? "component-node selected" : "component-node"}
                  cx={0}
                  cy={0}
                  onClick={(event) => {
                    if (event.shiftKey) {
                      onToggleComponentSelection(component.id);
                      return;
                    }
                    onSelectComponent(component.id);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    draggingNodeRef.current = {
                      id: component.id,
                      originX: event.clientX,
                      originY: event.clientY,
                      lastX: event.clientX,
                      lastY: event.clientY,
                      startX: component.x,
                      startY: component.y,
                    };

                    const onMove = (moveEvent: MouseEvent) => {
                      const drag = draggingNodeRef.current;
                      if (!drag) {
                        return;
                      }
                      draggingNodeRef.current = {
                        ...drag,
                        lastX: moveEvent.clientX,
                        lastY: moveEvent.clientY,
                      };
                    };

                    const onUp = () => {
                      const drag = draggingNodeRef.current;
                      if (drag) {
                        const dx = (drag.lastX - drag.originX) / viewport.zoom;
                        const dy = (drag.lastY - drag.originY) / viewport.zoom;
                        onMoveComponent(drag.id, drag.startX + dx, drag.startY + dy);
                      }
                      draggingNodeRef.current = null;
                      window.removeEventListener("mousemove", onMove);
                      window.removeEventListener("mouseup", onUp);
                    };

                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                  onMouseEnter={() => setHoveredId(component.id)}
                  onMouseLeave={() => setHoveredId((previous) => (previous === component.id ? null : previous))}
                  r={pointRadius + (selected ? 3 : hovered ? 2 : 0)}
                />
                <text className="component-label" x={14} y={4}>
                  {component.name}
                </text>
              </g>
            );
          })}

          {centroid ? <circle className="selection-centroid" cx={centroid.x} cy={centroid.y} r={5} /> : null}
        </g>
      </svg>

      <div className="canvas-overlay">
        <h1>Canvas</h1>
        <p>Drag nodes, wheel to zoom, and orchestrate layout using multiselect controls.</p>
        <div className="canvas-kpi-row">
          <span className="canvas-kpi">Selected: {selectedComponentName}</span>
          <span className="canvas-kpi">Count: {selectedComponentIds.length}</span>
          <span className="canvas-kpi">Components: {componentCount}</span>
        </div>
        <div className="canvas-kpi-row">
          <span className="canvas-kpi">Route: {routeStatus}</span>
          <span className="canvas-kpi">Distance: {routeDistance}</span>
          <span className="canvas-kpi">Simulation: {simulationSummary}</span>
        </div>
        <div className="canvas-kpi-row">
          <span className="canvas-kpi">Zoom: {(viewport.zoom * 100).toFixed(0)}%</span>
          <span className="canvas-kpi">
            Offset: {viewport.offsetX},{viewport.offsetY}
          </span>
          <span className="canvas-kpi">Snap: {viewport.snapToGrid ? "On" : "Off"}</span>
        </div>
        <div className="canvas-kpi-row">
          <span className="canvas-kpi">Layers: {sortedLayers.join(", ") || "None"}</span>
          <span className="canvas-kpi">Path: {routePreview || "N/A"}</span>
        </div>

        <div className="canvas-actions">
          <button className="action-btn" onClick={onPlaceComponent} type="button">
            Place Component
          </button>
          <button className="action-btn" onClick={onCenterSelection} type="button">
            Center Selection
          </button>
          <button className="action-btn" onClick={onClearSelection} type="button">
            Clear Selection
          </button>
          <button className="action-btn" onClick={onFitAll} type="button">
            Fit All
          </button>
          <button className="action-btn" onClick={() => onMoveSelectedBy(-25, 0)} type="button">
            Move Sel Left
          </button>
          <button className="action-btn" onClick={() => onMoveSelectedBy(25, 0)} type="button">
            Move Sel Right
          </button>
          <button className="action-btn" onClick={() => onMoveSelectedBy(0, -25)} type="button">
            Move Sel Up
          </button>
          <button className="action-btn" onClick={() => onMoveSelectedBy(0, 25)} type="button">
            Move Sel Down
          </button>
          <button className="action-btn" onClick={() => onPanBy(-80, 0)} type="button">
            Pan Left
          </button>
          <button className="action-btn" onClick={() => onPanBy(80, 0)} type="button">
            Pan Right
          </button>
          <button className="action-btn" onClick={() => onPanBy(0, -80)} type="button">
            Pan Up
          </button>
          <button className="action-btn" onClick={() => onPanBy(0, 80)} type="button">
            Pan Down
          </button>
          <button className="action-btn" onClick={() => onZoomBy(1.1)} type="button">
            Zoom In
          </button>
          <button className="action-btn" onClick={() => onZoomBy(0.9)} type="button">
            Zoom Out
          </button>
          <button className="action-btn" onClick={onToggleGrid} type="button">
            {viewport.showGrid ? "Hide Grid" : "Show Grid"}
          </button>
          <button className="action-btn" onClick={onToggleSnap} type="button">
            {viewport.snapToGrid ? "Disable Snap" : "Enable Snap"}
          </button>
          <button className="action-btn" onClick={onResetViewport} type="button">
            Reset View
          </button>
        </div>
      </div>
    </div>
  );
}
