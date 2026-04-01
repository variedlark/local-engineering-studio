import { describe, expect, it } from "vitest";
import { optimizeRouteOrder, routeQualityScore, runAutorouter } from "./autorouter";

describe("autorouter", () => {
  it("routes multiple nets and returns summary", () => {
    const result = runAutorouter(
      {
        width: 200,
        height: 200,
        step: 10,
        blockedPoints: [],
        ripupRetries: 2,
      },
      [
        { net: "N1", start: { x: 0, y: 0 }, end: { x: 100, y: 0 } },
        { net: "N2", start: { x: 0, y: 20 }, end: { x: 100, y: 20 } },
      ],
    );
    expect(result.summary.requested).toBe(2);
    expect(result.routes).toHaveLength(2);
  });

  it("optimizes route order and computes score", () => {
    const ordered = optimizeRouteOrder([
      { net: "A", start: { x: 0, y: 0 }, end: { x: 20, y: 0 } },
      { net: "B", start: { x: 0, y: 0 }, end: { x: 120, y: 0 } },
    ]);
    expect(ordered[0]?.net).toBe("B");

    const score = routeQualityScore([
      {
        net: "N1",
        strategy: "astar",
        route: { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], cost: 50 },
      },
    ]);
    expect(score).toBeGreaterThan(0);
  });
});
