import { describe, expect, it } from "vitest";
import {
  buildExportPackage,
  exportPackageSizeBytes,
  serializeExportPackage,
  summarizeExportPackage,
} from "./export-plan";

describe("export plan", () => {
  it("builds export package", () => {
    const pkg = buildExportPackage({
      projectName: "Demo",
      revision: 4,
      qualityScore: 88,
      qualitySummary: "88/100",
      healthReport: null,
      notes: [{ id: "n1", text: "hello", pinned: true, createdAt: 1 }],
      activityEvents: [
        {
          id: "e1",
          at: 2,
          kind: "system",
          status: "info",
          title: "Start",
          detail: "started",
        },
      ],
      generatedAt: 42,
    });

    expect(pkg.manifest.projectName).toBe("Demo");
    expect(pkg.notes.length).toBe(1);
  });

  it("serializes and computes size", () => {
    const pkg = buildExportPackage({
      projectName: "Demo",
      revision: 1,
      qualityScore: null,
      qualitySummary: "Pending",
      healthReport: null,
      notes: [],
      activityEvents: [],
    });
    const text = serializeExportPackage(pkg);
    expect(text.length).toBeGreaterThan(0);
    expect(exportPackageSizeBytes(pkg)).toBeGreaterThan(0);
    expect(summarizeExportPackage(pkg)).toMatch(/Export Demo/);
  });
});
