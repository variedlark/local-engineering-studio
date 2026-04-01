import { describe, expect, it } from "vitest";
import {
  addSessionNote,
  deleteSessionNote,
  notesDigest,
  toggleSessionNotePinned,
} from "./session-notes";

describe("session notes", () => {
  it("adds notes and trims whitespace", () => {
    const next = addSessionNote([], "  hello world  ");
    expect(next).toHaveLength(1);
    expect(next[0]?.text).toBe("hello world");
  });

  it("toggles pinned state", () => {
    const base = addSessionNote([], "note");
    const toggled = toggleSessionNotePinned(base, base[0]!.id);
    expect(toggled[0]?.pinned).toBe(true);
  });

  it("deletes notes", () => {
    const base = addSessionNote([], "note");
    const next = deleteSessionNote(base, base[0]!.id);
    expect(next).toHaveLength(0);
  });

  it("builds note digest", () => {
    const a = addSessionNote([], "first");
    const b = addSessionNote(a, "second");
    const digest = notesDigest(b);
    expect(digest.count).toBe(2);
    expect(digest.recent.length).toBeGreaterThan(0);
  });
});
