import { describe, expect, it } from "vitest";
import {
  buildSessionTimeline,
  computeCommandPressure,
  computeSessionKpi,
  detectSessionSpikes,
  projectSessionNarrative,
} from "./session-analytics";

const base = 1700000000000;

const events = [
  { id: "1", at: base, kind: "command", status: "ok", title: "A", detail: "a" },
  { id: "2", at: base + 1000, kind: "analysis", status: "ok", title: "B", detail: "b" },
  { id: "3", at: base + 2000, kind: "quality", status: "warn", title: "C", detail: "c" },
  { id: "4", at: base + 62000, kind: "command", status: "error", title: "D", detail: "d" },
] as const;

describe("session analytics", () => {
  it("builds timeline", () => {
    const timeline = buildSessionTimeline(events as never);
    expect(timeline.length).toBeGreaterThan(0);
  });

  it("computes KPI", () => {
    const kpi = computeSessionKpi(events as never);
    expect(kpi.avgEventsPerMinute).toBeGreaterThan(0);
    expect(kpi.errorRate).toBeGreaterThan(0);
  });

  it("creates narrative", () => {
    const narrative = projectSessionNarrative(events as never);
    expect(narrative).toMatch(/Momentum/);
  });

  it("detects spikes", () => {
    const spikes = detectSessionSpikes(events as never, 2);
    expect(spikes.length).toBeGreaterThan(0);
  });

  it("computes command pressure", () => {
    const pressure = computeCommandPressure(events as never);
    expect(pressure).toBeGreaterThan(0);
  });
});
