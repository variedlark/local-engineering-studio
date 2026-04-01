import { describe, expect, it } from "vitest";
import type { AppProject } from "../../domain/types";
import { buildPcpLifecycleReport } from "./pcp-lifecycle";

function createProject(componentCount: number): AppProject {
  const components = Object.fromEntries(
    Array.from({ length: componentCount }, (_, index) => {
      const id = `00000000-0000-7000-8000-${(index + 1).toString().padStart(12, "0")}`;
      return [
        id,
        {
          id,
          name: `U${index + 1}`,
          position: { x: index * 120, y: (index % 2) * 80 },
          layer: 0,
        },
      ];
    }),
  );

  return {
    project_id: "11111111-1111-7111-8111-111111111111",
    name: "Lifecycle Demo",
    revision: 1,
    dirty: false,
    can_undo: false,
    can_redo: false,
    model: {
      meta: {
        project_id: "11111111-1111-7111-8111-111111111111",
        name: "Lifecycle Demo",
        format_major: 1,
        format_minor: 0,
        created_at_ms: 1,
        updated_at_ms: 1,
        revision: 1,
      },
      components,
      nets: {
        "22222222-2222-7222-8222-222222222222": {},
      },
      rules: {
        min_spacing_um: 100,
        grid_step_um: 50,
      },
    },
  };
}

describe("pcp lifecycle", () => {
  it("returns empty metrics when no project is available", () => {
    const report = buildPcpLifecycleReport(null, { minSpacingUm: 100, gridStepUm: 50 });
    expect(report.hasDesignData).toBe(false);
    expect(report.manufacturing.fileCount).toBe(0);
    expect(report.catalog.total).toBe(0);
  });

  it("computes lifecycle metrics for a populated design", () => {
    const report = buildPcpLifecycleReport(createProject(4), {
      minSpacingUm: 100,
      gridStepUm: 50,
    });
    expect(report.hasDesignData).toBe(true);
    expect(report.schematic.symbolCount).toBe(4);
    expect(report.layout.componentCount).toBe(4);
    expect(report.routing.requested).toBeGreaterThan(0);
    expect(report.manufacturing.fileCount).toBeGreaterThan(0);
    expect(report.catalog.total).toBeGreaterThan(0);
    expect(report.catalog.candidates).toBeGreaterThan(0);
  });
});
