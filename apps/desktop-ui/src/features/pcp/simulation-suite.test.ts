import { describe, expect, it } from "vitest";
import { runSimulationSuite, samplePathSimulation, summarizeSimulation } from "./simulation-suite";

describe("simulation-suite", () => {
  it("runs all simulation domains", () => {
    const result = runSimulationSuite({
      si: { lengthUm: 24000, riseTimeNs: 0.8, impedanceOhm: 50 },
      pi: { currentA: 0.9, resistanceOhm: 0.05, supplyV: 3.3 },
      thermal: { powerW: 1.2, thetaJa: 30, ambientC: 25 },
      timing: { pathDelayNs: 3, clockPeriodNs: 10, setupNs: 1, holdNs: 0.3 },
    });
    expect(result.aggregateScore).toBeGreaterThan(0);
    expect(summarizeSimulation(result)).toMatch(/aggregate/);
  });

  it("samples path simulation waveform", () => {
    const samples = samplePathSimulation([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ]);
    expect(samples).toHaveLength(3);
  });
});
