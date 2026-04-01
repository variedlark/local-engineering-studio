import { describe, expect, it } from "vitest";
import {
  addConstraintClass,
  addRuleToClass,
  createConstraintSet,
  exportConstraintSet,
  importConstraintSet,
  resolveConstraints,
  validateConstraintSet,
} from "./constraint-manager";

describe("constraint-manager", () => {
  it("adds classes and rules then resolves constraints", () => {
    const set = addConstraintClass(createConstraintSet(), {
      name: "HighSpeed",
      type: "net",
      selectors: ["NET_CLK"],
      priority: 200,
      rules: [],
    });
    const classId = set.classes[0]!.id;
    const withRule = addRuleToClass(set, classId, {
      key: "min_spacing",
      value: 120,
      unit: "um",
    });
    const resolved = resolveConstraints(withRule, [{ selector: "NET_CLK", key: "min_spacing" }]);
    expect(resolved[0]?.value).toBe(120);
  });

  it("validates and serializes constraint set", () => {
    const set = addConstraintClass(createConstraintSet(), {
      name: "Diff",
      type: "diff_pair",
      selectors: ["PAIR_USB"],
      rules: [{ id: "r1", key: "pair_gap", value: 90 }],
    });
    const validation = validateConstraintSet(set);
    expect(validation.valid).toBe(true);

    const text = exportConstraintSet(set);
    const imported = importConstraintSet(text);
    expect(imported.classes).toHaveLength(1);
  });
});
