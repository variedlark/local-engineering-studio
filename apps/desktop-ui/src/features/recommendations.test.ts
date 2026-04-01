import { describe, expect, it } from "vitest";
import { buildRecommendations } from "./recommendations";

describe("buildRecommendations", () => {
  it("emits critical recommendation for routing failures", () => {
    const recommendations = buildRecommendations({
      drcViolations: 0,
      qualityScore: 80,
      routeStatus: "No route",
      simulationSummary: "Stable",
      selectedCount: 0,
      hasHealthReport: false,
      notesCount: 0,
      pinnedNotesCount: 0,
    });
    expect(recommendations.some((entry) => entry.id === "route-fail")).toBe(true);
  });

  it("returns healthy recommendation for strong state", () => {
    const recommendations = buildRecommendations({
      drcViolations: 0,
      qualityScore: 95,
      routeStatus: "Path length 14",
      simulationSummary: "Stable",
      selectedCount: 4,
      hasHealthReport: true,
      notesCount: 2,
      pinnedNotesCount: 1,
    });
    expect(recommendations[0]?.id).toBe("healthy");
  });
});
