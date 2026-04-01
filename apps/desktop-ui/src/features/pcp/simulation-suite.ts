import type { Point } from "./board-kernel";

export type SignalIntegrityInput = {
  lengthUm: number;
  riseTimeNs: number;
  impedanceOhm: number;
};

export type PowerIntegrityInput = {
  currentA: number;
  resistanceOhm: number;
  supplyV: number;
};

export type ThermalInput = {
  powerW: number;
  thetaJa: number;
  ambientC: number;
};

export type TimingInput = {
  pathDelayNs: number;
  clockPeriodNs: number;
  setupNs: number;
  holdNs: number;
};

export type SimulationSuiteResult = {
  si: {
    estimatedOvershootPct: number;
    estimatedJitterPs: number;
    qualityScore: number;
  };
  pi: {
    voltageDropV: number;
    marginV: number;
    qualityScore: number;
  };
  thermal: {
    junctionC: number;
    headroomC: number;
    qualityScore: number;
  };
  timing: {
    setupSlackNs: number;
    holdSlackNs: number;
    qualityScore: number;
  };
  aggregateScore: number;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function runSignalIntegrity(input: SignalIntegrityInput) {
  const normalizedLength = Math.max(0, input.lengthUm);
  const overshoot = Math.max(
    0,
    round3((normalizedLength / 10000) * (Math.max(0.1, 100 / Math.max(1, input.impedanceOhm)))),
  );
  const jitter = Math.max(0, round3(input.riseTimeNs * 8 + normalizedLength / 3000));
  const score = clampScore(100 - overshoot * 6 - jitter / 8);
  return {
    estimatedOvershootPct: overshoot,
    estimatedJitterPs: jitter,
    qualityScore: score,
  };
}

export function runPowerIntegrity(input: PowerIntegrityInput) {
  const drop = round3(Math.max(0, input.currentA) * Math.max(0, input.resistanceOhm));
  const margin = round3(input.supplyV - drop);
  const score = clampScore(100 - drop * 40);
  return {
    voltageDropV: drop,
    marginV: margin,
    qualityScore: score,
  };
}

export function runThermal(input: ThermalInput) {
  const junction = round3(input.ambientC + Math.max(0, input.powerW) * Math.max(0, input.thetaJa));
  const headroom = round3(125 - junction);
  const score = clampScore(100 - Math.max(0, junction - 60) * 1.3);
  return {
    junctionC: junction,
    headroomC: headroom,
    qualityScore: score,
  };
}

export function runTiming(input: TimingInput) {
  const setupSlack = round3(input.clockPeriodNs - input.pathDelayNs - input.setupNs);
  const holdSlack = round3(input.pathDelayNs - input.holdNs);
  const worstSlack = Math.min(setupSlack, holdSlack);
  const score = clampScore(100 + worstSlack * 20);
  return {
    setupSlackNs: setupSlack,
    holdSlackNs: holdSlack,
    qualityScore: score,
  };
}

export function runSimulationSuite(input: {
  si: SignalIntegrityInput;
  pi: PowerIntegrityInput;
  thermal: ThermalInput;
  timing: TimingInput;
}): SimulationSuiteResult {
  const si = runSignalIntegrity(input.si);
  const pi = runPowerIntegrity(input.pi);
  const thermal = runThermal(input.thermal);
  const timing = runTiming(input.timing);
  const aggregateScore = clampScore(
    (si.qualityScore + pi.qualityScore + thermal.qualityScore + timing.qualityScore) / 4,
  );
  return {
    si,
    pi,
    thermal,
    timing,
    aggregateScore,
  };
}

export function summarizeSimulation(result: SimulationSuiteResult) {
  return `SI ${result.si.qualityScore}, PI ${result.pi.qualityScore}, TH ${result.thermal.qualityScore}, TM ${result.timing.qualityScore}, aggregate ${result.aggregateScore}`;
}

export function samplePathSimulation(path: Point[], amplitude = 1) {
  return path.map((point, index) => ({
    t: index,
    value: round3(Math.sin(index / 3) * amplitude + (point.x + point.y) / 10000),
  }));
}
