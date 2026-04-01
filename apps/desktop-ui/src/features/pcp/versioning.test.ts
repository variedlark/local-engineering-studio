import { describe, expect, it } from "vitest";
import {
  commitVersion,
  createBranch,
  createHistory,
  mergeBranch,
  summarizeHistory,
  versionDiff,
} from "./versioning";

describe("versioning", () => {
  it("commits and summarizes history", () => {
    const base = createHistory({ score: 1 }, "alice");
    const next = commitVersion(base, { payload: { score: 2 }, author: "alice", message: "Update" });
    const summary = summarizeHistory(next);
    expect(summary.versionCount).toBe(2);
    expect(summary.currentRevision).toBe(2);
  });

  it("branches and merges", () => {
    const base = commitVersion(createHistory({ value: 1 }), {
      payload: { value: 2 },
      author: "dev",
      message: "main update",
    });
    const withBranch = createBranch(base, "feature-x");
    const feature = commitVersion(withBranch, {
      payload: { value: 3 },
      author: "dev",
      message: "feature",
      branch: "feature-x",
    });
    const merged = mergeBranch(feature, "feature-x", "main", "dev");
    expect(merged.versions.length).toBeGreaterThan(feature.versions.length);
  });

  it("computes diffs", () => {
    const history = createHistory({ a: 1, b: 2 });
    const next = commitVersion(history, { payload: { a: 1, b: 3 }, author: "dev", message: "b" });
    const diff = versionDiff(history.versions[0] as never, next.versions[1] as never);
    expect(diff.some((entry) => entry.key === "b")).toBe(true);
  });
});
