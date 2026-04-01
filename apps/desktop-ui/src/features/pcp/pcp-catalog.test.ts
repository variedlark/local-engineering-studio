import { describe, expect, it } from "vitest";
import {
  createIndustrialCatalog,
  queryIndustrialCatalog,
  summarizeIndustrialCatalog,
} from "./pcp-catalog";

describe("pcp-catalog", () => {
  it("creates deterministic dataset", () => {
    const a = createIndustrialCatalog(10, 42);
    const b = createIndustrialCatalog(10, 42);
    expect(a).toEqual(b);
    expect(a).toHaveLength(10);
  });

  it("supports filtered queries", () => {
    const entries = createIndustrialCatalog(200, 7);
    const first = entries[0];
    const result = queryIndustrialCatalog(entries, {
      family: first.family,
      lifecycle: first.lifecycle,
      compliance: first.compliance,
      limit: 20,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((entry) => entry.family === first.family)).toBe(true);
  });

  it("summarizes lifecycle distribution", () => {
    const entries = createIndustrialCatalog(99, 1);
    const summary = summarizeIndustrialCatalog(entries);
    expect(summary.total).toBe(99);
    expect(summary.active + summary.nrnd + summary.obsolete).toBe(99);
  });
});
