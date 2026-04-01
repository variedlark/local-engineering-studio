import { describe, expect, it } from "vitest";
import { qualitySummary, scoreQuality, staleQualityState } from "./ui-store.quality";

describe("ui-store.quality", () => {
  it("scores healthy projects higher", () => {
    const healthy = scoreQuality({
      drcViolations: 0,
      routeSuccess: true,
      simulationStable: true,
      componentCount: 6,
    });
    const problematic = scoreQuality({
      drcViolations: 5,
      routeSuccess: false,
      simulationStable: false,
      componentCount: 6,
    });
    expect(healthy).toBeGreaterThan(problematic);
  });

  it("produces readable quality summary", () => {
    const summary = qualitySummary({
      score: 88,
      drcViolations: 1,
      routeSuccess: true,
      simulationStable: true,
    });
    expect(summary).toContain("88/100");
    expect(summary).toContain("route ok");
  });

  it("returns stale quality marker", () => {
    const stale = staleQualityState();
    expect(stale.qualityScore).toBeNull();
    expect(stale.qualitySummary).toContain("Stale");
  });
});
