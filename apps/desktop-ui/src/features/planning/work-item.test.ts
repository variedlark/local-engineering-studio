import { describe, expect, it } from "vitest";
import {
  applyBulkTransition,
  buildBurndown,
  createWorkItem,
  detectBlockedWorkItems,
  estimateCompletionDate,
  groupWorkItemsByStatus,
  mergeWorkItemLists,
  scoreWorkItem,
  sortWorkItems,
  updateWorkItem,
} from "./work-item";

describe("work-item domain helpers", () => {
  it("creates and updates work items", () => {
    const item = createWorkItem({ title: "Refactor canvas", estimateHours: 8 });
    expect(item.title).toBe("Refactor canvas");
    const updated = updateWorkItem(item, { status: "in_progress", priority: "p1" });
    expect(updated.status).toBe("in_progress");
    expect(updated.priority).toBe("p1");
  });

  it("scores and sorts work items", () => {
    const a = createWorkItem({ title: "A", priority: "p0", estimateHours: 10 });
    const b = createWorkItem({ title: "B", priority: "p3", estimateHours: 2 });
    const sorted = sortWorkItems([b, a]);
    expect(scoreWorkItem(a)).toBeGreaterThan(scoreWorkItem(b));
    expect(sorted[0]?.id).toBe(a.id);
  });

  it("groups and transitions by status", () => {
    const a = createWorkItem({ title: "A" });
    const b = createWorkItem({ title: "B" });
    const transitioned = applyBulkTransition([a, b], [a.id], "done");
    const grouped = groupWorkItemsByStatus(transitioned);
    expect(grouped.done).toHaveLength(1);
  });

  it("detects blocked items by dependencies", () => {
    const base = createWorkItem({ title: "Base" });
    const dependent = createWorkItem({ title: "Dependent", dependencies: [base.id] });
    const blocked = detectBlockedWorkItems([base, dependent]);
    expect(blocked.some((entry) => entry.id === dependent.id)).toBe(true);
  });

  it("estimates completion date and burndown", () => {
    const a = createWorkItem({ title: "A", estimateHours: 4 });
    const b = createWorkItem({ title: "B", estimateHours: 6 });
    const estimate = estimateCompletionDate([a, b], 5);
    expect(estimate).toBeGreaterThan(Date.now());

    const burndown = buildBurndown([a, b], 5);
    expect(burndown).toHaveLength(6);
    expect(burndown[0]?.remainingHours).toBeGreaterThanOrEqual(burndown[5]?.remainingHours ?? 0);
  });

  it("merges work item lists by latest update", () => {
    const original = createWorkItem({ title: "Original" });
    const newer = updateWorkItem(original, { title: "Updated" });
    const merged = mergeWorkItemLists([newer], [original]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.title).toBe("Updated");
  });
});
