import { describe, expect, it } from "vitest";
import {
  buildFitAllEntries,
  buildNudgeEntries,
  createQuickActionDefinitions,
  suggestedTemplate,
} from "./app-shell-actions";

describe("app shell actions helpers", () => {
  it("builds fit-all entries", () => {
    const entries = buildFitAllEntries(
      [
        { id: "a", name: "A", x: 0, y: 0, layer: 0 },
        { id: "b", name: "B", x: 0, y: 0, layer: 0 },
      ],
      100,
    );
    expect(entries).toHaveLength(2);
    expect(entries[1]?.x).toBeGreaterThanOrEqual(0);
  });

  it("builds nudge entries only for selected ids", () => {
    const entries = buildNudgeEntries(
      ["a"],
      [
        { id: "a", name: "A", x: 10, y: 20, layer: 0 },
        { id: "b", name: "B", x: 30, y: 40, layer: 0 },
      ],
      5,
      -2,
    );
    expect(entries).toEqual([{ componentId: "a", x: 15, y: 18 }]);
  });

  it("suggests templates by project size", () => {
    expect(suggestedTemplate(0)).toBe("grid_3x3");
    expect(suggestedTemplate(2)).toBe("line_5");
    expect(suggestedTemplate(10)).toBe("ring_8");
  });

  it("creates quick action definitions", () => {
    const noop = () => undefined;
    const actions = createQuickActionDefinitions({
      selectedCount: 0,
      hasProject: true,
      onPlaceComponent: noop,
      onPlaceTemplate: noop,
      template: "grid_3x3",
      onDuplicate: noop,
      onQualitySuite: noop,
      onDrc: noop,
      onRoute: noop,
      onSimulation: noop,
      onUndo: noop,
      onRedo: noop,
      onSave: noop,
      onAutosave: noop,
      onAlignCenterX: noop,
      onDistributeHorizontal: noop,
      onToggleSnap: noop,
      onResetViewport: noop,
      onOpenPalette: noop,
    });
    expect(actions.length).toBeGreaterThan(10);
    expect(actions.some((action) => action.id === "quality")).toBe(true);
  });
});
