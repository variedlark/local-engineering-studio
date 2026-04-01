import { describe, expect, it } from "vitest";
import { classifyRouteQuality, compareRoutes, evaluateRouteQuality } from "./route-quality";

describe("route-quality", () => {
  it("evaluates route metrics", () => {
    const report = evaluateRouteQuality([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    expect(report.segmentCount).toBe(2);
    expect(report.bendCount).toBe(1);
  });

  it("classifies quality scores", () => {
    expect(classifyRouteQuality(92)).toBe("excellent");
    expect(classifyRouteQuality(55)).toBe("fair");
    expect(classifyRouteQuality(20)).toBe("poor");
  });

  it("compares two routes", () => {
    const result = compareRoutes(
      [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 6, y: 6 },
      ],
    );
    expect(result.better).toBe("primary");
  });
});
