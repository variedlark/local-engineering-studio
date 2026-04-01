import { describe, expect, it } from "vitest";
import {
  computeActivityPulse,
  computeDashboardMetrics,
  computeSelectionCentroid,
} from "./dashboard-metrics";

describe("computeActivityPulse", () => {
  it("counts events by kind and returns latest", () => {
    const pulse = computeActivityPulse([
      { id: "1", at: 20, kind: "system", status: "info", title: "A", detail: "a" },
      { id: "2", at: 10, kind: "analysis", status: "ok", title: "B", detail: "b" },
    ]);
    expect(pulse.total).toBe(2);
    expect(pulse.latest?.id).toBe("1");
    expect(pulse.byKind.find((entry) => entry.kind === "system")?.count).toBe(1);
  });
});

describe("computeDashboardMetrics", () => {
  it("returns a stable card collection", () => {
    const cards = computeDashboardMetrics({
      revision: 3,
      componentCount: 5,
      netCount: 2,
      selectedCount: 2,
      drcViolations: 0,
      routeStatus: "Path length 12",
      simulationSummary: "Stable",
      qualityScore: 91,
      qualitySummary: "91/100",
      healthReport: null,
      activityEvents: [],
    });
    expect(cards.length).toBeGreaterThanOrEqual(6);
    expect(cards.some((card) => card.id === "quality" && card.tone === "good")).toBe(true);
  });
});

describe("computeSelectionCentroid", () => {
  it("returns null for empty selection", () => {
    expect(computeSelectionCentroid([], [])).toBeNull();
  });

  it("computes centroid of selected components", () => {
    const centroid = computeSelectionCentroid(
      ["a", "b"],
      [
        { id: "a", x: 0, y: 10 },
        { id: "b", x: 20, y: 30 },
        { id: "c", x: 90, y: 40 },
      ],
    );
    expect(centroid).toEqual({ x: 10, y: 20 });
  });
});
