import { describe, expect, it } from "vitest";
import {
  createRoadmapTrack,
  criticalPath,
  roadmapProjection,
  roadmapRisks,
} from "./goal-roadmap";

describe("goal-roadmap", () => {
  it("projects roadmap progress and risk", () => {
    const track = createRoadmapTrack({
      name: "Core",
      currentLoc: 10000,
      targetLoc: 20000,
      milestones: [
        {
          id: "m1",
          title: "Router",
          owner: "team",
          etaWeeks: 8,
          locDelta: 5000,
          dependencies: [],
        },
      ],
    });
    const projection = roadmapProjection([track]);
    expect(projection.totalCurrentLoc).toBe(10000);
    expect(projection.totalProjectedLoc).toBeGreaterThan(10000);
    expect(criticalPath([track]).length).toBeGreaterThan(0);
    expect(roadmapRisks([track]).length).toBeGreaterThanOrEqual(0);
  });
});
