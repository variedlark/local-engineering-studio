import { describe, expect, it } from "vitest";
import { healthSummaryFromQualityScore, qualityActivityStatus } from "./ui-store.analysis";

describe("ui-store.analysis", () => {
  it("maps quality score to activity status", () => {
    expect(qualityActivityStatus(95)).toBe("ok");
    expect(qualityActivityStatus(75)).toBe("warn");
    expect(qualityActivityStatus(60)).toBe("error");
  });

  it("maps quality score to health summary", () => {
    expect(healthSummaryFromQualityScore(null)).toContain("quality pending");
    expect(healthSummaryFromQualityScore(90)).toContain("strong");
    expect(healthSummaryFromQualityScore(75)).toContain("watch");
    expect(healthSummaryFromQualityScore(30)).toContain("attention needed");
  });
});
