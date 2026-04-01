import { describe, expect, it } from "vitest";
import {
  movingAverageScores,
  qualityForecast,
  recommendQualityActions,
  trendFromSnapshots,
} from "./quality-trends";

const base = 1700000000000;

const snapshots = [
  { at: base, score: 70, drcViolations: 3, routeSuccess: false, simulationStable: true },
  { at: base + 60000, score: 75, drcViolations: 2, routeSuccess: true, simulationStable: true },
  { at: base + 120000, score: 80, drcViolations: 1, routeSuccess: true, simulationStable: true },
];

describe("quality trends", () => {
  it("builds trend from snapshots", () => {
    const trend = trendFromSnapshots(snapshots);
    expect(trend.direction).toBe("up");
    expect(trend.delta).toBeGreaterThan(0);
  });

  it("produces forecast points", () => {
    const forecast = qualityForecast(snapshots, 3);
    expect(forecast).toHaveLength(3);
    expect(forecast[0]!.projectedScore).toBeGreaterThan(0);
  });

  it("recommends quality actions", () => {
    const actions = recommendQualityActions(snapshots[0]!);
    expect(actions.length).toBeGreaterThan(0);
  });

  it("computes moving averages", () => {
    const averages = movingAverageScores(snapshots, 2);
    expect(averages).toHaveLength(3);
    expect(averages[2]!).toBeGreaterThanOrEqual(averages[0]!);
  });
});
