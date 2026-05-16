import type { Board } from "../../lib/pcb-types";
import { pointsToString } from "./canvas-utils";

type BoardOutlineProps = {
  board: Board;
};

export function BoardOutline({ board }: BoardOutlineProps) {
  return (
    <>
      <polygon
        points={pointsToString(board.outline)}
        fill="url(#boardSubstrate)"
        stroke="#f4c95d"
        strokeWidth=".7"
      />
      <polygon
        points={pointsToString(board.outline)}
        fill="none"
        stroke="rgba(57,217,138,.26)"
        strokeWidth="3"
      />
      <text x="4" y="-3" className="pcb-board-label">
        {board.name} · {board.width} × {board.height} mm
      </text>
    </>
  );
}
