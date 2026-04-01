import { describe, expect, it } from "vitest";
import {
  addTrack,
  addVia,
  addZone,
  boardStats,
  createBoard,
  placeComponent,
  validateBoard,
} from "./board-kernel";

describe("board-kernel", () => {
  it("creates board and computes stats", () => {
    const board = placeComponent(createBoard(5000, 4000), {
      ref: "U1",
      x: 1000,
      y: 1200,
      side: "top",
    });
    const withTrack = addTrack(board, {
      net: "VCC",
      layerId: "L1",
      from: { x: 1000, y: 1200 },
      to: { x: 1400, y: 1200 },
      width: 80,
    });
    const withVia = addVia(withTrack, {
      net: "VCC",
      x: 1400,
      y: 1200,
      drill: 200,
      diameter: 400,
      startLayer: "L1",
      endLayer: "L2",
    });
    const withZone = addZone(withVia, {
      net: "GND",
      layerId: "L2",
      polygon: [
        { x: 100, y: 100 },
        { x: 900, y: 100 },
        { x: 900, y: 900 },
      ],
      clearance: 120,
    });

    const stats = boardStats(withZone);
    expect(stats.componentCount).toBe(1);
    expect(stats.trackCount).toBe(1);
    expect(stats.viaCount).toBe(1);
    expect(stats.zoneCount).toBe(1);

    const validation = validateBoard(withZone);
    expect(validation.valid).toBe(true);
  });
});
