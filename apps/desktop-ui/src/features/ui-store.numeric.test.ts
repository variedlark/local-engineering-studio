import { describe, expect, it } from "vitest";
import {
  sanitizeNonNegativeFloat,
  sanitizePositiveFloat,
  sanitizePositiveInt,
} from "./ui-store.numeric";

describe("ui-store.numeric", () => {
  it("sanitizes positive integers", () => {
    expect(sanitizePositiveInt(5.7, 3)).toBe(6);
    expect(sanitizePositiveInt(-1, 3)).toBe(3);
    expect(sanitizePositiveInt(Number.NaN, 3)).toBe(3);
  });

  it("sanitizes non-negative floats", () => {
    expect(sanitizeNonNegativeFloat(2.5, 1)).toBe(2.5);
    expect(sanitizeNonNegativeFloat(-2.5, 1)).toBe(0);
    expect(sanitizeNonNegativeFloat(Number.NaN, 1)).toBe(1);
  });

  it("sanitizes positive floats with minimum", () => {
    expect(sanitizePositiveFloat(0.05, 0.1, 0.01)).toBe(0.05);
    expect(sanitizePositiveFloat(0, 0.1, 0.01)).toBe(0.01);
    expect(sanitizePositiveFloat(Number.NaN, 0.1, 0.01)).toBe(0.1);
  });
});
