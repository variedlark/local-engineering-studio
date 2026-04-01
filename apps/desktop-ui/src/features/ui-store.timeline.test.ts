import { describe, expect, it } from "vitest";
import type { ActivityEvent } from "./ui-store.types";
import { pruneTransientState } from "./ui-store.timeline";

describe("ui-store.timeline", () => {
  it("prunes transient state fields while appending replay activity", () => {
    const next = pruneTransientState({
      busy: true,
      paletteOpen: true,
      projectId: null,
      project: null,
      selectedComponentId: null,
      selectedComponentIds: [],
      routeEndpoints: { from: null, to: null },
      statusMessage: "before",
      healthReport: null,
      canvasViewport: { offsetX: 0, offsetY: 0, zoom: 1, showGrid: true, snapToGrid: true },
      logs: [],
      activityEvents: [] as ActivityEvent[],
    });

    expect(next.busy).toBe(false);
    expect(next.paletteOpen).toBe(false);
    expect(next.statusMessage).toBe("Restored from replay");
    expect(next.activityEvents?.[0]?.title).toBe("Replay");
  });
});
