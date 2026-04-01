import { describe, expect, it } from "vitest";
import {
  addPlanItem,
  boardHealth,
  createPlanBoard,
  mergePlanBoards,
  setPlanItemStatus,
  summarizePlanBoard,
} from "./plan-board";

describe("plan-board", () => {
  it("creates and summarizes board", () => {
    const board = createPlanBoard({ sprintDays: 7, dailyCapacityHours: 5 });
    const withItem = addPlanItem(board, { title: "Implement layout" });
    const summary = summarizePlanBoard(withItem);
    expect(summary.totalItems).toBe(1);
    expect(summary.burndown.length).toBe(8);
  });

  it("supports status transitions", () => {
    const board = addPlanItem(createPlanBoard(), { title: "A" });
    const id = board.items[0]!.id;
    const done = setPlanItemStatus(board, [id], "done");
    expect(done.items[0]?.status).toBe("done");
  });

  it("merges boards", () => {
    const one = addPlanItem(createPlanBoard(), { title: "One" });
    const two = addPlanItem(createPlanBoard(), { title: "Two" });
    const merged = mergePlanBoards(one, two);
    expect(merged.items.length).toBe(2);
  });

  it("evaluates board health", () => {
    const board = addPlanItem(createPlanBoard(), { title: "A" });
    const done = setPlanItemStatus(board, [board.items[0]!.id], "done");
    expect(boardHealth(done)).toBe("healthy");
  });
});
