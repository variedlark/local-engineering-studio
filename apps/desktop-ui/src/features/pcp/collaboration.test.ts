import { describe, expect, it } from "vitest";
import {
  addAnnotation,
  addTask,
  addUser,
  createCollaborationState,
  resolveAnnotation,
  summarizeCollaboration,
  updateTaskStatus,
} from "./collaboration";

describe("collaboration", () => {
  it("tracks users, annotations, and tasks", () => {
    const withUser = addUser(createCollaborationState(), { name: "Ada", role: "owner" });
    const userId = withUser.users[0]!.id;
    const withAnnotation = addAnnotation(withUser, {
      authorId: userId,
      target: "NET_CLK",
      message: "check noise",
    });
    const withTask = addTask(withAnnotation, "Route DDR pairs", userId);

    const resolved = resolveAnnotation(withTask, withTask.annotations[0]!.id);
    const done = updateTaskStatus(resolved, resolved.tasks[0]!.id, "done");
    const summary = summarizeCollaboration(done);

    expect(summary.users).toBe(1);
    expect(summary.openAnnotations).toBe(0);
    expect(summary.doneTasks).toBe(1);
  });
});
