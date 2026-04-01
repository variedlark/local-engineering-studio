import { describe, expect, it } from "vitest";
import { setStatusFromError } from "./ui-store.project";
import type { ActivityEvent } from "./ui-store.types";

type ErrorState = {
  statusMessage: string;
  activityEvents: ActivityEvent[];
};

describe("ui-store.project", () => {
  it("stores error message when error is Error", () => {
    let state: ErrorState = { statusMessage: "ok", activityEvents: [] };
    const set = (partial: Partial<ErrorState> | ((current: ErrorState) => Partial<ErrorState>)) => {
      const patch = typeof partial === "function" ? partial(state) : partial;
      state = { ...state, ...patch };
    };

    setStatusFromError(set, new Error("boom"), "fallback");

    expect(state.statusMessage).toBe("boom");
    expect(state.activityEvents[0]?.title).toBe("Operation failed");
  });

  it("falls back to provided message for unknown error", () => {
    let state: ErrorState = { statusMessage: "ok", activityEvents: [] };
    const set = (partial: Partial<ErrorState> | ((current: ErrorState) => Partial<ErrorState>)) => {
      const patch = typeof partial === "function" ? partial(state) : partial;
      state = { ...state, ...patch };
    };

    setStatusFromError(set, { any: "value" }, "fallback");

    expect(state.statusMessage).toBe("fallback");
    expect(state.activityEvents[0]?.detail).toBe("fallback");
  });
});
