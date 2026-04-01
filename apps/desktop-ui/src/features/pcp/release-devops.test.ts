import { describe, expect, it } from "vitest";
import { planRelease, summarizeReleasePlan, validateReleasePlan } from "./release-devops";

describe("release-devops", () => {
  it("plans and validates release", () => {
    const plan = planRelease("1.2.0");
    const validation = validateReleasePlan(plan);
    expect(validation.valid).toBe(true);

    const summary = summarizeReleasePlan(plan);
    expect(summary.artifactCount).toBeGreaterThan(0);
    expect(summary.benchmarkPassRate).toBe(100);
  });
});
