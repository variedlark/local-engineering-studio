export type ConstraintClassType = "net" | "diff_pair" | "region" | "component";

export type ConstraintRule = {
  id: string;
  key: string;
  value: number | string | boolean;
  unit?: string;
};

export type ConstraintClass = {
  id: string;
  name: string;
  type: ConstraintClassType;
  selectors: string[];
  priority: number;
  rules: ConstraintRule[];
};

export type ConstraintSet = {
  classes: ConstraintClass[];
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeSelectors(selectors: string[]) {
  return Array.from(new Set(selectors.map((selector) => selector.trim()).filter(Boolean)));
}

function normalizePriority(priority: number) {
  if (!Number.isFinite(priority)) {
    return 100;
  }
  return Math.max(1, Math.round(priority));
}

function normalizeRules(rules: ConstraintRule[]) {
  return rules.map((rule) => ({
    ...rule,
    key: rule.key.trim(),
    unit: rule.unit?.trim(),
  }));
}

export function createConstraintSet(): ConstraintSet {
  return { classes: [] };
}

export function addConstraintClass(
  set: ConstraintSet,
  input: Omit<ConstraintClass, "id" | "selectors" | "priority" | "rules"> & {
    selectors?: string[];
    priority?: number;
    rules?: ConstraintRule[];
  },
): ConstraintSet {
  const created: ConstraintClass = {
    id: uid("cc"),
    name: input.name.trim() || "Unnamed Class",
    type: input.type,
    selectors: normalizeSelectors(input.selectors ?? []),
    priority: normalizePriority(input.priority ?? 100),
    rules: normalizeRules(input.rules ?? []),
  };
  return {
    classes: [...set.classes, created].sort((a, b) => b.priority - a.priority),
  };
}

export function updateConstraintClass(
  set: ConstraintSet,
  classId: string,
  patch: Partial<Omit<ConstraintClass, "id">>,
): ConstraintSet {
  return {
    classes: set.classes
      .map((entry) => {
        if (entry.id !== classId) {
          return entry;
        }
        return {
          ...entry,
          ...patch,
          name: patch.name ? patch.name.trim() : entry.name,
          selectors: patch.selectors ? normalizeSelectors(patch.selectors) : entry.selectors,
          priority: patch.priority !== undefined ? normalizePriority(patch.priority) : entry.priority,
          rules: patch.rules ? normalizeRules(patch.rules) : entry.rules,
        };
      })
      .sort((a, b) => b.priority - a.priority),
  };
}

export function deleteConstraintClass(set: ConstraintSet, classId: string): ConstraintSet {
  return {
    classes: set.classes.filter((entry) => entry.id !== classId),
  };
}

export function addRuleToClass(
  set: ConstraintSet,
  classId: string,
  rule: Omit<ConstraintRule, "id" | "key"> & { key: string },
): ConstraintSet {
  return updateConstraintClass(set, classId, {
    rules: [
      ...(set.classes.find((entry) => entry.id === classId)?.rules ?? []),
      {
        id: uid("rule"),
        key: rule.key.trim(),
        value: rule.value,
        unit: rule.unit,
      },
    ],
  });
}

export function resolveConstraints(
  set: ConstraintSet,
  targets: {
    selector: string;
    key: string;
  }[],
) {
  return targets.map((target) => {
    const matching = set.classes
      .filter((entry) => entry.selectors.includes(target.selector))
      .sort((a, b) => b.priority - a.priority);

    for (const entry of matching) {
      const rule = entry.rules.find((candidate) => candidate.key === target.key);
      if (rule) {
        return {
          selector: target.selector,
          key: target.key,
          value: rule.value,
          className: entry.name,
          classId: entry.id,
        };
      }
    }

    return {
      selector: target.selector,
      key: target.key,
      value: null,
      className: null,
      classId: null,
    };
  });
}

export function validateConstraintSet(set: ConstraintSet) {
  const issues: string[] = [];
  const names = new Set<string>();

  for (const entry of set.classes) {
    if (names.has(entry.name)) {
      issues.push(`Duplicate class name: ${entry.name}`);
    }
    names.add(entry.name);

    if (entry.selectors.length === 0) {
      issues.push(`Class ${entry.name} has no selectors`);
    }
    if (entry.rules.length === 0) {
      issues.push(`Class ${entry.name} has no rules`);
    }

    const ruleKeys = new Set<string>();
    for (const rule of entry.rules) {
      if (!rule.key) {
        issues.push(`Class ${entry.name} has rule with empty key`);
      }
      if (ruleKeys.has(rule.key)) {
        issues.push(`Class ${entry.name} has duplicate rule key ${rule.key}`);
      }
      ruleKeys.add(rule.key);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function exportConstraintSet(set: ConstraintSet) {
  return JSON.stringify(set, null, 2);
}

export function importConstraintSet(text: string): ConstraintSet {
  const parsed = JSON.parse(text) as Partial<ConstraintSet>;
  if (!parsed || !Array.isArray(parsed.classes)) {
    return createConstraintSet();
  }

  return {
    classes: parsed.classes.map((entry) => ({
      id: entry.id || uid("cc"),
      name: entry.name?.trim() || "Unnamed Class",
      type: entry.type || "net",
      selectors: normalizeSelectors(entry.selectors ?? []),
      priority: normalizePriority(entry.priority ?? 100),
      rules: normalizeRules(entry.rules ?? []),
    })),
  };
}
