import { describe, expect, it } from "vitest";
import { createHistory } from "./versioning";
import {
  addReviewComment,
  addSignoff,
  canRelease,
  createReviewWorkspace,
  resolveReviewComment,
} from "./review-signoff";

describe("review-signoff", () => {
  it("tracks review comments and release status", () => {
    const history = createHistory({ score: 1 });
    const version = history.versions[0]!;
    const withComment = addReviewComment(createReviewWorkspace(version), {
      author: "qa",
      line: "nets/N1",
      message: "Check spacing",
    });

    expect(canRelease(withComment).releasable).toBe(false);

    const resolved = resolveReviewComment(withComment, withComment.comments[0]!.id);
    const signed = addSignoff(
      addSignoff(
        addSignoff(
          addSignoff(resolved, { reviewer: "a", gate: "design", approved: true }),
          { reviewer: "b", gate: "drc", approved: true },
        ),
        { reviewer: "c", gate: "simulation", approved: true },
      ),
      { reviewer: "d", gate: "manufacturing", approved: true },
    );

    expect(canRelease(signed).releasable).toBe(true);
  });
});
