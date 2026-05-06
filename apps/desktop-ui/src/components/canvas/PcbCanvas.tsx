import { memo, useMemo } from "react";
import type {
  Board,
  Component,
  Point,
  ViewportState,
} from "../../lib/pcb-types";
import { formatCoordinate } from "../../lib/units";

type PcbCanvasProps = {
  board: Board | null;
  viewport: ViewportState;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string | null) => void;
  onCursorMove: (x: number, y: number) => void;
  onZoomBy: (factor: number) => void;
};

function pointsToString(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function componentSize(component: Component) {
  return component.footprint.package === "QFN"
    ? { width: 16, height: 16 }
    : { width: 9, height: 4.8 };
}

export const PcbCanvas = memo(function PcbCanvas({
  board,
  viewport,
  selectedComponentId,
  onSelectComponent,
  onCursorMove,
  onZoomBy,
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

  return (
    <section
      className="pcb-canvas-shell"
      aria-label="PCB canvas"
      onDoubleClick={() => onSelectComponent(null)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 180;
        const y = ((event.clientY - rect.top) / rect.height) * 120;
        onCursorMove(x, y);
      }}
      onWheel={(event) => {
        event.preventDefault();
        onZoomBy(event.deltaY > 0 ? 0.92 : 1.08);
      }}
    >
      <div className="pcb-canvas-topline">
        <span>{board ? board.name : "No board loaded"}</span>
        <span>
          {formatCoordinate(viewport.cursor.x, viewport.unit)} /{" "}
          {formatCoordinate(viewport.cursor.y, viewport.unit)}
        </span>
      </div>
      <svg
        className="pcb-canvas"
        viewBox="0 0 180 120"
        role="img"
        aria-label="Mock PCB layout with tracks, vias and components"
      >
        <defs>
          <pattern
            id="majorGrid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="rgba(148,163,184,.16)"
              strokeWidth=".25"
            />
          </pattern>
          <pattern
            id="minorGrid"
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 2 0 L 0 0 0 2"
              fill="none"
              stroke="rgba(148,163,184,.07)"
              strokeWidth=".15"
            />
          </pattern>
          <filter id="selectionGlow">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="#55f0ff"
              floodOpacity="0.9"
            />
          </filter>
        </defs>
        <rect width="180" height="120" fill="url(#minorGrid)" />
        <rect width="180" height="120" fill="url(#majorGrid)" />
        {board ? (
          <g
            transform={`translate(8 4) scale(${viewport.zoom}) translate(${viewport.offset.x} ${viewport.offset.y})`}
          >
            <polygon
              points={pointsToString(board.outline)}
              fill="rgba(16,185,129,.08)"
              stroke="#f4c95d"
              strokeWidth=".7"
            />
            <polygon
              points={pointsToString(board.outline)}
              fill="none"
              stroke="rgba(57,217,138,.26)"
              strokeWidth="3"
            />

            {board.tracks
              .filter((track) => visibleLayerIds.has(track.layerId))
              .map((track) => (
                <polyline
                  key={track.id}
                  points={pointsToString(track.points)}
                  fill="none"
                  stroke={layerColor.get(track.layerId) ?? "#fff"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={track.width * 5}
                  opacity="0.9"
                />
              ))}

            {board.vias.map((via) => (
              <g
                key={via.id}
                transform={`translate(${via.position.x} ${via.position.y})`}
              >
                <circle
                  r={via.diameter * 2.7}
                  fill="#0b1120"
                  stroke="#55f0ff"
                  strokeWidth=".55"
                />
                <circle
                  r={via.drill * 2.2}
                  fill="#020617"
                  stroke="rgba(255,255,255,.45)"
                  strokeWidth=".25"
                />
              </g>
            ))}

            {board.components.map((component) => {
              const size = componentSize(component);
              const selected = selectedComponentId === component.id;
              return (
                <g
                  key={component.id}
                  className="pcb-component"
                  transform={`translate(${component.position.x} ${component.position.y}) rotate(${component.rotation})`}
                  filter={selected ? "url(#selectionGlow)" : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectComponent(component.id);
                  }}
                  role="button"
                  aria-label={`Select ${component.reference}`}
                >
                  <rect
                    x={-size.width / 2}
                    y={-size.height / 2}
                    width={size.width}
                    height={size.height}
                    rx="1.2"
                    fill={
                      component.layerId === "bottom-copper"
                        ? "#14224a"
                        : "#171923"
                    }
                    stroke={selected ? "#55f0ff" : "rgba(216,225,255,.7)"}
                    strokeWidth={selected ? ".8" : ".35"}
                  />
                  {component.footprint.pads.map((pad) => (
                    <rect
                      key={pad.id}
                      x={pad.position.x - pad.width / 2}
                      y={pad.position.y - pad.height / 2}
                      width={pad.width}
                      height={pad.height}
                      rx={pad.shape === "rect" ? ".2" : ".8"}
                      fill={layerColor.get(component.layerId) ?? "#ff5c5c"}
                      opacity=".88"
                    />
                  ))}
                  <text
                    y={size.height / 2 + 4}
                    textAnchor="middle"
                    className="pcb-refdes"
                  >
                    {component.reference}
                  </text>
                </g>
              );
            })}

            {board.components.map((component) => (
              <line
                key={`${component.id}-ratsnest`}
                x1={component.position.x}
                y1={component.position.y}
                x2="96"
                y2="68"
                stroke="rgba(244,201,93,.42)"
                strokeWidth=".25"
                strokeDasharray="1.4 1.6"
              />
            ))}
          </g>
        ) : (
          <g>
            <rect
              x="38"
              y="28"
              width="104"
              height="58"
              rx="4"
              fill="rgba(15,23,42,.58)"
              stroke="rgba(85,240,255,.32)"
              strokeDasharray="2 2"
            />
            <text x="90" y="57" textAnchor="middle" className="pcb-empty-label">
              Open a local project or load the demo PCB
            </text>
            <text x="90" y="66" textAnchor="middle" className="pcb-empty-sub">
              Canvas engine ready for typed board data
            </text>
          </g>
        )}
      </svg>
      <div className="viewport-controls" aria-label="Viewport controls">
        <span>{Math.round(viewport.zoom * 100)}%</span>
        <span>Grid {viewport.gridMm} mm</span>
        <span>{viewport.snap ? "Snap on" : "Snap off"}</span>
      </div>
    </section>
  );
});
