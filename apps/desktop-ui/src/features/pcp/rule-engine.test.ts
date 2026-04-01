import { describe, expect, it } from "vitest";
import { createBoard, placeComponent, addTrack, addVia } from "./board-kernel";
import { runRuleEngine, summarizeRuleReport } from "./rule-engine";

describe("rule-engine", () => {
  it("reports issues for invalid geometry", () => {
    const board = addVia(
      addTrack(
        placeComponent(createBoard(3000, 3000), {
          ref: "U1",
          x: 100,
          y: 100,
          side: "top",
        }),
        {
          net: "N1",
          layerId: "L1",
          from: { x: 100, y: 100 },
          to: { x: 200, y: 100 },
          width: 10,
        },
      ),
      {
        net: "N1",
        x: 200,
        y: 100,
        drill: 300,
        diameter: 320,
        startLayer: "L1",
        endLayer: "L2",
      },
    );

    const report = runRuleEngine({
      board,
      minTrackWidth: 50,
      minClearance: 80,
      minViaAnnularRing: 30,
    });
    expect(report.issues.length).toBeGreaterThan(0);
    expect(summarizeRuleReport(report)).toMatch(/issues/);
  });
});
