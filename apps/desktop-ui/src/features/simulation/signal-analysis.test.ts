import { describe, expect, it } from "vitest";
import { analyzeSignal, compareSignals, summarizeSignal } from "./signal-analysis";

describe("signal analysis", () => {
  it("analyzes point cloud", () => {
    const analysis = analyzeSignal([
      { t: 0, value: 0 },
      { t: 1, value: 1 },
      { t: 2, value: -1 },
      { t: 3, value: 0.5 },
    ]);
    expect(analysis.max).toBe(1);
    expect(analysis.min).toBe(-1);
    expect(analysis.slopeChanges).toBeGreaterThan(0);
  });

  it("summarizes analysis", () => {
    const summary = summarizeSignal({
      min: -1,
      max: 2,
      average: 0.1,
      peakToPeak: 3,
      slopeChanges: 2,
      zeroCrossings: 1,
      stabilityScore: 78,
    });
    expect(summary).toMatch(/stability/);
  });

  it("compares two signal sets", () => {
    const compare = compareSignals(
      [
        { t: 0, value: 0 },
        { t: 1, value: 0.1 },
        { t: 2, value: 0.2 },
      ],
      [
        { t: 0, value: -2 },
        { t: 1, value: 2 },
        { t: 2, value: -2 },
      ],
    );
    expect(compare.better).toBe("primary");
  });
});
