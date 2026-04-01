import { describe, expect, it } from "vitest";
import {
  addViewportSnapshot,
  deleteViewportSnapshot,
  findViewportSnapshot,
  snapshotSummary,
} from "./viewport-snapshots";

const viewport = {
  offsetX: 10,
  offsetY: 20,
  zoom: 1.2,
  showGrid: true,
  snapToGrid: false,
};

describe("viewport snapshots", () => {
  it("adds snapshots with cap", () => {
    const one = addViewportSnapshot([], viewport, "A", 2);
    const two = addViewportSnapshot(one, viewport, "B", 2);
    const three = addViewportSnapshot(two, viewport, "C", 2);
    expect(three).toHaveLength(2);
  });

  it("finds and deletes snapshot", () => {
    const all = addViewportSnapshot([], viewport, "A");
    const target = all[0]!;
    expect(findViewportSnapshot(all, target.id)?.id).toBe(target.id);
    expect(deleteViewportSnapshot(all, target.id)).toHaveLength(0);
  });

  it("creates readable summary", () => {
    const all = addViewportSnapshot([], viewport, "A");
    expect(snapshotSummary(all[0]!)).toMatch(/Zoom/);
  });
});
