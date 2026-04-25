export interface ValidationRule {
  id: string;
  name: string;
  validate: (data: any) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  autoFix?: (data: any) => any;
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
  value?: any;
  suggestion?: string;
}

export interface ValidationWarning {
  id: string;
  message: string;
  field?: string;
  value?: any;
}

export class ValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();

  registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of this.rules.values()) {
      const result = rule.validate(data);
      if (!result.valid) {
        if (rule.severity === 'error') {
          errors.push(...result.errors);
        } else if (rule.severity === 'warning') {
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

  async autoFix(data: any): Promise<any> {
    let fixed = { ...data };

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

  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }
}

// Example validation rules
export const createComponentValidationRules = (): ValidationRule[] => [
  {
    id: 'component-has-name',
    name: 'Component must have a name',
    severity: 'error',
    validate: (component) => ({
      valid: !!component.name && component.name.trim().length > 0,
      errors: !component.name
        ? [
            {
              id: 'no-name',
              message: 'Component must have a name',
              field: 'name',
              suggestion: 'Provide a unique component identifier',
            },
          ]
        : [],
      warnings: [],
    }),
    autoFix: (component) => ({
      ...component,
      name: component.name || `Component_${Date.now()}`,
    }),
  },
  {
    id: 'component-valid-position',
    name: 'Component position must be valid',
    severity: 'error',
    validate: (component) => {
      const valid =
        typeof component.position?.x === 'number' &&
        typeof component.position?.y === 'number' &&
        component.position.x >= 0 &&
        component.position.y >= 0;

      return {
        valid,
        errors: !valid
          ? [
              {
                id: 'invalid-position',
                message: 'Component position must be valid coordinates',
                field: 'position',
                suggestion: 'Ensure x and y are non-negative numbers',
              },
            ]
          : [],
        warnings: [],
      };
    },
    autoFix: (component) => ({
      ...component,
      position: {
        x: Math.max(0, component.position?.x ?? 0),
        y: Math.max(0, component.position?.y ?? 0),
      },
    }),
  },
  {
    id: 'component-valid-dimensions',
    name: 'Component dimensions must be positive',
    severity: 'warning',
    validate: (component) => {
      const valid =
        (component.width_um ?? 0) > 0 &&
        (component.height_um ?? 0) > 0;

      return {
        valid,
        errors: [],
        warnings: !valid
          ? [
              {
                id: 'invalid-dimensions',
                message: 'Component dimensions should be positive values',
                field: 'dimensions',
              },
            ]
          : [],
      };
    },
    autoFix: (component) => ({
      ...component,
      width_um: Math.max(1, component.width_um ?? 1),
      height_um: Math.max(1, component.height_um ?? 1),
    }),
  },
];

export const createNetValidationRules = (): ValidationRule[] => [
  {
    id: 'net-has-name',
    name: 'Net must have a name',
    severity: 'error',
    validate: (net) => ({
      valid: !!net.name && net.name.trim().length > 0,
      errors: !net.name
        ? [
            {
              id: 'no-name',
              message: 'Net must have a name',
              field: 'name',
            },
          ]
        : [],
      warnings: [],
    }),
  },
  {
    id: 'net-has-connections',
    name: 'Net must have at least 2 connections',
    severity: 'warning',
    validate: (net) => {
      const connectionCount = (net.connections ?? []).length;
      const valid = connectionCount >= 2;

      return {
        valid,
        errors: [],
        warnings: !valid
          ? [
              {
                id: 'insufficient-connections',
                message: `Net has only ${connectionCount} connection(s), but should have at least 2`,
                field: 'connections',
              },
            ]
          : [],
      };
    },
  },
];

export const globalValidationEngine = new ValidationEngine();
