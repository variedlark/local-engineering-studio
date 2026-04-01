import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePersistedState } from "./use-persisted-state";

describe("usePersistedState", () => {
  it("returns initial value when storage is unavailable", () => {
    const original = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {},
    });

    const { result } = renderHook(() =>
      usePersistedState("test.key", ["a"], {
        version: 1,
      }),
    );

    expect(result.current[0]).toEqual(["a"]);

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: original,
    });
  });

  it("supports updating value", () => {
    const { result } = renderHook(() =>
      usePersistedState("test.state", 1, {
        version: 1,
      }),
    );

    act(() => {
      result.current[1](3);
    });
    expect(result.current[0]).toBe(3);
  });
});
