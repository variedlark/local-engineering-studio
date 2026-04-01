import { describe, expect, it } from "vitest";
import { createBoard, placeComponent, addTrack, addVia } from "./board-kernel";
import { exportManufacturingPackage } from "./manufacturing-exports";

describe("manufacturing-exports", () => {
  it("exports manufacturing package formats", () => {
    const board = addVia(
      addTrack(
        placeComponent(createBoard(3000, 3000), {
          ref: "U1",
          x: 400,
          y: 500,
          side: "top",
        }),
        {
          net: "N1",
          layerId: "L1",
          from: { x: 400, y: 500 },
          to: { x: 800, y: 500 },
          width: 80,
        },
      ),
      {
        net: "N1",
        x: 800,
        y: 500,
        drill: 200,
        diameter: 400,
        startLayer: "L1",
        endLayer: "L2",
      },
    );

    const files = exportManufacturingPackage(board);
    expect(files.length).toBeGreaterThanOrEqual(6);
    expect(files.some((file) => file.format === "ipc2581")).toBe(true);
  });
});
