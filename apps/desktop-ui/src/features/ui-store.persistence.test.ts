import { describe, expect, it } from "vitest";
import { buildExportPath, normalizeRules } from "./ui-store.persistence";

describe("ui-store.persistence", () => {
  it("builds deterministic export paths", () => {
    expect(buildExportPath("./root", "pid", "json")).toBe("./root/pid/exports/project-export.json");
    expect(buildExportPath("./root", "pid", "svg")).toBe("./root/pid/exports/layout.svg");
  });

  it("normalizes and validates rules", () => {
    expect(normalizeRules(99.4, 33)).toEqual({ spacing: 99, grid: 33 });
    expect(() => normalizeRules(101, 50)).toThrow("Minimum spacing must be an integer multiple of grid step");
  });
});
