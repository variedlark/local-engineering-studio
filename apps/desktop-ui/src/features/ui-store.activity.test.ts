import { describe, expect, it } from "vitest";
import { prependActivity, prependLog } from "./ui-store.activity";

describe("ui-store.activity", () => {
  it("prepends activity and limits timeline length", () => {
    const events = Array.from({ length: 240 }, (_, index) => ({
      id: `event-${index}`,
      at: index,
      kind: "system" as const,
      status: "info" as const,
      title: `Title ${index}`,
      detail: "detail",
    }));

    const next = prependActivity(events, "command", "ok", "Action", "detail");
    expect(next).toHaveLength(240);
    expect(next[0]?.title).toBe("Action");
  });

  it("prepends logs and keeps recent 120 entries", () => {
    const logs = Array.from({ length: 130 }, (_, index) => `log-${index}`);
    const next = prependLog(logs, "new entry");
    expect(next).toHaveLength(120);
    expect(next[0]).toContain("new entry");
  });
});
