import { memo, useEffect, useMemo, useRef, useState } from "react";
import { computeSelectionCentroid } from "../features/dashboard-metrics";
import { THEME_CONFIG } from "../theme/ThemeConfig";

type CanvasViewportProps = {
  onMoveComponent: (componentId: string, x: number, y: number) => void;
  onSelectComponent: (componentId: string | null) => void;
  onToggleComponentSelection: (componentId: string) => void;
  onZoomBy: (factor: number) => void;
  viewport: {
    offsetX: number;
    offsetY: number;
    zoom: number;
    showGrid: boolean;
    snapToGrid: boolean;
  };
  components: Array<{ id: string; name: string; x: number; y: number; layer: number }>;
  selectedComponentIds: string[];
  routePath: Array<{ x: number; y: number }>;
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

function gridOpacity(zoom: number) {
  const normalized = (zoom - 0.35) / 1.2;
  return Math.min(0.28, Math.max(0, normalized * 0.3));
}

function smoothStep(current: number, target: number) {
  return current + (target - current) * 0.12;
}

export const CanvasViewport = memo(function CanvasViewport({
  onMoveComponent,
  onSelectComponent,
  onToggleComponentSelection,
  onZoomBy,
  viewport,
  components,
  selectedComponentIds,
  routePath,
}: CanvasViewportProps) {
    const draggingNodeRef = useRef<DragState | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [smoothViewport, setSmoothViewport] = useState(() => ({
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
      zoom: viewport.zoom,
    }));
    const smoothRef = useRef(smoothViewport);
    const targetRef = useRef(viewport);
    const rafRef = useRef<number | null>(null);

  const centroid = useMemo(
    () => computeSelectionCentroid(selectedComponentIds, components),
    [selectedComponentIds, components],
  );
  const bounds = useMemo(
    () => selectionBounds(components, selectedComponentIds),
    [components, selectedComponentIds],
  );
  const selectedSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);
  const gridFade = useMemo(
    () => (viewport.showGrid ? gridOpacity(smoothViewport.zoom) : 0),
    [smoothViewport.zoom, viewport.showGrid],
  );

  useEffect(() => {
    smoothRef.current = smoothViewport;
  }, [smoothViewport]);

  useEffect(() => {
    targetRef.current = viewport;
    if (rafRef.current !== null) {
      return;
    }
    const tick = () => {
      const current = smoothRef.current;
      const target = targetRef.current;
      const next = {
        offsetX: smoothStep(current.offsetX, target.offsetX),
        offsetY: smoothStep(current.offsetY, target.offsetY),
        zoom: smoothStep(current.zoom, target.zoom),
      };
      smoothRef.current = next;
      setSmoothViewport(next);
      const closeEnough =
        Math.abs(next.offsetX - target.offsetX) < 0.3 &&
        Math.abs(next.offsetY - target.offsetY) < 0.3 &&
        Math.abs(next.zoom - target.zoom) < 0.002;
      if (closeEnough) {
        rafRef.current = null;
        setSmoothViewport({
          offsetX: target.offsetX,
          offsetY: target.offsetY,
          zoom: target.zoom,
        });
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [viewport]);

  const pointRadius = THEME_CONFIG.sizes.nodeRadius;

  return (
    <div
      className="absolute inset-0 canvas-surface"
      role="img"
      aria-label="Design canvas viewport"
      onDoubleClick={() => onSelectComponent(null)}
      onWheel={(event) => {
        event.preventDefault();
        onZoomBy(event.deltaY > 0 ? 0.92 : 1.08);
      }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--les-grid)" opacity={gridFade} />
          </pattern>
          <radialGradient id="node-gradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="var(--les-accent)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--les-accent)" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="node-gradient-alt" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="var(--les-accent-alt)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--les-accent-alt)" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="route-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--les-accent)" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--les-accent-alt)" />
          </linearGradient>
        </defs>
        {viewport.showGrid ? <rect className="dot-grid" height="100%" opacity={gridFade} width="100%" /> : null}

        <g transform={`translate(${smoothViewport.offsetX} ${smoothViewport.offsetY}) scale(${smoothViewport.zoom})`}>
          {routePath.length > 1 ? (
            <polyline
              className="canvas-route"
              points={routePath.map((point) => `${point.x},${point.y}`).join(" ")}
              strokeDasharray="6 12"
            />
          ) : null}

          {bounds ? (
            <rect
              className="selection-halo"
              height={Math.max(1, bounds.maxY - bounds.minY + 12)}
              width={Math.max(1, bounds.maxX - bounds.minX + 12)}
              x={bounds.minX - 6}
              y={bounds.minY - 6}
            />
          ) : null}

          {components.map((component) => {
            const selected = selectedSet.has(component.id);
            const hovered = hoveredId === component.id;
            const className = [
              "canvas-node",
              component.layer < 0 ? "layer-bottom" : "",
              selected ? "canvas-node-selected" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g key={component.id} transform={`translate(${component.x} ${component.y})`}>
                <circle
                  className={className}
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
                <text className="canvas-label" x={12} y={4}>
                  {component.name}
                </text>
              </g>
            );
          })}

          {centroid ? <circle className="selection-halo" cx={centroid.x} cy={centroid.y} r={6} /> : null}
        </g>
      </svg>
    </div>
  );
});
