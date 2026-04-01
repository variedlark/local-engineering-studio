import { describe, expect, it } from "vitest";
import {
  analyzeComplexity,
  computeDevExScore,
  suggestRefactorTargets,
} from "./dev-experience";

describe("dev-experience", () => {
  it("analyzes complexity and computes score", () => {
    const report = analyzeComplexity([
      { file: "ui-store.ts", functions: 90, branches: 40, lines: 1900 },
      { file: "panel.tsx", functions: 12, branches: 5, lines: 260 },
    ]);
    expect(report.averageComplexity).toBeGreaterThan(0);

    const score = computeDevExScore(report, {
      contributors: 3,
      weeklyCommits: 22,
      avgReviewTimeHours: 8,
    });
    expect(score.score).toBeGreaterThanOrEqual(0);

    const suggestions = suggestRefactorTargets(report);
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
