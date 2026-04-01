import { describe, expect, it } from "vitest";
import {
  batchMoveSelection,
  clampLayer,
  createBatchMoveCommands,
  ensureOk,
  projectStep,
  snapCoordinate,
  templatePoints,
} from "./ui-store.commands";

describe("ui-store.commands", () => {
  it("clamps layer within supported range", () => {
    expect(clampLayer(99)).toBe(32);
    expect(clampLayer(-99)).toBe(-32);
    expect(clampLayer(3.4)).toBe(3);
  });

  it("creates batch move commands", () => {
    const commands = createBatchMoveCommands([
      { componentId: "a", x: 10.1, y: 20.6 },
      { componentId: "b", x: -3.2, y: 7.7 },
    ]);
    expect(commands).toHaveLength(2);
    expect(commands[0]?.type).toBe("move_component");
  });

  it("returns focused selection for single move batch", () => {
    const batch = batchMoveSelection(
      { selectedComponentIds: ["x", "y"] },
      [{ componentId: "x", x: 10, y: 20 }],
      "move_one",
    );
    expect(batch.selectedIds).toEqual(["x"]);
    expect(batch.label).toBe("move_one");
  });

  it("applies grid snapping helpers", () => {
    expect(
      projectStep({
        workspacePreferences: {
          autosaveIntervalSec: 30,
          coordinateStepUm: 7,
          showStatusHints: true,
          accent: "sky",
          density: "comfortable",
        },
      }),
    ).toBe(10);
    expect(snapCoordinate(123, 50)).toBe(100);
  });

  it("generates template points", () => {
    expect(templatePoints("line_5", 10)).toHaveLength(5);
    expect(templatePoints("ring_8", 10)).toHaveLength(8);
    expect(templatePoints("grid_3x3", 10)).toHaveLength(9);
  });

  it("throws when command result is not ok", () => {
    expect(() => ensureOk({ ok: true }, "fallback")).not.toThrow();
    expect(() => ensureOk({ ok: false, message: "boom" }, "fallback")).toThrow("boom");
  });
});
