import type { Board } from "../../lib/pcb-types";
import { componentSize, pointsToString } from "./canvas-utils";

type LayerRendererProps = {
  board: Board;
  selectedComponentId: string | null;
  visibleLayerIds: Set<string>;
  layerColor: Map<string, string>;
  onSelectComponent: (componentId: string | null) => void;
};

export function LayerRenderer({
  board,
  selectedComponentId,
  visibleLayerIds,
  layerColor,
  onSelectComponent,
}: LayerRendererProps) {
  return (
    <>
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
        <g key={via.id} transform={`translate(${via.position.x} ${via.position.y})`}>
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
              fill={component.layerId === "bottom-copper" ? "#14224a" : "#171923"}
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
            <text y={size.height / 2 + 4} textAnchor="middle" className="pcb-refdes">
              {component.reference}
            </text>
          </g>
        );
      })}
    </>
  );
}
