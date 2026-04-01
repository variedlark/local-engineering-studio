import { describe, expect, it } from "vitest";
import { buildSessionLayout } from "./session-layout";

describe("buildSessionLayout", () => {
  it("returns focused layout for high zoom", () => {
    const layout = buildSessionLayout({
      hasProject: true,
      notesCount: 1,
      snapshotsCount: 1,
      viewportZoom: 2,
    });
    expect(layout.variant).toBe("focused");
  });

  it("returns wide layout for heavy support state", () => {
    const layout = buildSessionLayout({
      hasProject: true,
      notesCount: 9,
      snapshotsCount: 0,
      viewportZoom: 1,
    });
    expect(layout.variant).toBe("wide");
  });

  it("hides project-dependent sections without project", () => {
    const layout = buildSessionLayout({
      hasProject: false,
      notesCount: 0,
      snapshotsCount: 0,
      viewportZoom: 1,
    });
    const canvas = layout.sections.find((section) => section.id === "canvas");
    expect(canvas?.visible).toBe(false);
  });
});
