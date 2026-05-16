export type ValidationData = Record<string, unknown>;

type PositionLike = {
  x?: unknown;
  y?: unknown;
};

export interface ValidationRule<TData extends ValidationData = ValidationData> {
  id: string;
  name: string;
  validate: (data: TData) => ValidationResult;
  severity: "error" | "warning" | "info";
  autoFix?: (data: TData) => TData;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  id: string;
  message: string;
  field?: string;
  value?: unknown;
  suggestion?: string;
}

export interface ValidationWarning {
  id: string;
  message: string;
  field?: string;
  value?: unknown;
}

function asPosition(value: unknown): PositionLike {
  return typeof value === "object" && value !== null
    ? (value as PositionLike)
    : {};
}

function stringField(data: ValidationData, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

function numberField(
  data: ValidationData,
  key: string,
  fallback: number,
): number {
  const value = data[key];
  return typeof value === "number" ? value : fallback;
}

export class ValidationEngine<TData extends ValidationData = ValidationData> {
  private rules: Map<string, ValidationRule<TData>> = new Map();

  registerRule(rule: ValidationRule<TData>): void {
    this.rules.set(rule.id, rule);
  }

  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  validate(data: TData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of this.rules.values()) {
      const result = rule.validate(data);
      if (!result.valid) {
        if (rule.severity === "error") {
          errors.push(...result.errors);
        } else if (rule.severity === "warning") {
          warnings.push(...result.warnings);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async autoFix(data: TData): Promise<TData> {
    let fixed = { ...data } as TData;

    for (const rule of this.rules.values()) {
      if (rule.autoFix) {
        const result = rule.validate(fixed);
        if (!result.valid) {
          fixed = rule.autoFix(fixed);
        }
      }
    }

    return fixed;
  }

  getRules(): ValidationRule<TData>[] {
    return Array.from(this.rules.values());
  }
}

// Example validation rules
export const createComponentValidationRules = (): ValidationRule[] => [
  {
    id: "component-has-name",
    name: "Component must have a name",
    severity: "error",
    validate: (component) => {
      const name = stringField(component, "name");
      return {
        valid: name.trim().length > 0,
        errors:
          name.trim().length === 0
            ? [
                {
                  id: "no-name",
                  message: "Component must have a name",
                  field: "name",
                  suggestion: "Provide a unique component identifier",
                },
              ]
            : [],
        warnings: [],
      };
    },
    autoFix: (component) => ({
      ...component,
      name: stringField(component, "name") || `Component_${Date.now()}`,
    }),
  },
  {
    id: "component-valid-position",
    name: "Component position must be valid",
    severity: "error",
    validate: (component) => {
      const position = asPosition(component.position);
      const valid =
        typeof position.x === "number" &&
        typeof position.y === "number" &&
        position.x >= 0 &&
        position.y >= 0;

      return {
        valid,
        errors: !valid
          ? [
              {
                id: "invalid-position",
                message: "Component position must be valid coordinates",
                field: "position",
                suggestion: "Ensure x and y are non-negative numbers",
              },
            ]
          : [],
        warnings: [],
      };
    },
    autoFix: (component) => {
      const position = asPosition(component.position);
      return {
        ...component,
        position: {
          x: Math.max(0, typeof position.x === "number" ? position.x : 0),
          y: Math.max(0, typeof position.y === "number" ? position.y : 0),
        },
      };
    },
  },
  {
    id: "component-valid-dimensions",
    name: "Component dimensions must be positive",
    severity: "warning",
    validate: (component) => {
      const valid =
        numberField(component, "width_um", 0) > 0 &&
        numberField(component, "height_um", 0) > 0;

      return {
        valid,
        errors: [],
        warnings: !valid
          ? [
              {
                id: "invalid-dimensions",
                message: "Component dimensions should be positive values",
                field: "dimensions",
              },
            ]
          : [],
      };
    },
    autoFix: (component) => ({
      ...component,
      width_um: Math.max(1, numberField(component, "width_um", 1)),
      height_um: Math.max(1, numberField(component, "height_um", 1)),
    }),
  },
];

export const createNetValidationRules = (): ValidationRule[] => [
  {
    id: "net-has-name",
    name: "Net must have a name",
    severity: "error",
    validate: (net) => {
      const name = stringField(net, "name");
      return {
        valid: name.trim().length > 0,
        errors:
          name.trim().length === 0
            ? [
                {
                  id: "no-name",
                  message: "Net must have a name",
                  field: "name",
                },
              ]
            : [],
        warnings: [],
      };
    },
  },
  {
    id: "net-has-connections",
    name: "Net must have at least 2 connections",
    severity: "warning",
    validate: (net) => {
      const connections = Array.isArray(net.connections) ? net.connections : [];
      const connectionCount = connections.length;
      const valid = connectionCount >= 2;

      return {
        valid,
        errors: [],
        warnings: !valid
          ? [
              {
                id: "insufficient-connections",
                message: `Net has only ${connectionCount} connection(s), but should have at least 2`,
                field: "connections",
              },
            ]
          : [],
      };
    },
  },
];

export const globalValidationEngine = new ValidationEngine();
