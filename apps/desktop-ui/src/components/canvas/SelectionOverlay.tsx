import type { Board, DrcViolation } from "../../lib/pcb-types";
import { componentSize } from "./canvas-utils";

type SelectionOverlayProps = {
  board: Board;
  selectedComponentId: string | null;
  selectedViolation: DrcViolation | null;
};

export function SelectionOverlay({
  board,
  selectedComponentId,
  selectedViolation,
}: SelectionOverlayProps) {
  const selectedComponent = board.components.find(
    (component) => component.id === selectedComponentId,
  );

  return (
    <>
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
      {selectedComponent ? (
        <g
          transform={`translate(${selectedComponent.position.x} ${selectedComponent.position.y}) rotate(${selectedComponent.rotation})`}
          className="pcb-selection-box"
        >
          <rect
            x={-componentSize(selectedComponent).width / 2 - 1.6}
            y={-componentSize(selectedComponent).height / 2 - 1.6}
            width={componentSize(selectedComponent).width + 3.2}
            height={componentSize(selectedComponent).height + 3.2}
            rx="1.4"
          />
        </g>
      ) : null}
      {selectedViolation ? (
        <g
          transform={`translate(${selectedViolation.location.x} ${selectedViolation.location.y})`}
        >
          <circle className="pcb-drc-pulse" r="4.2" />
          <text x="5" y="-4" className="pcb-drc-label">
            {selectedViolation.rule}
          </text>
        </g>
      ) : null}
    </>
  );
export function SelectionOverlay() {
  return null;
}
