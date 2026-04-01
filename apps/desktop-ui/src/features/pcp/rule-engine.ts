import type { BoardModel } from "./board-kernel";

export type RuleSeverity = "info" | "warn" | "error";

export type RuleIssue = {
  id: string;
  code: string;
  severity: RuleSeverity;
  message: string;
  meta?: Record<string, string | number | boolean>;
};

export type RuleContext = {
  board: BoardModel;
  minTrackWidth: number;
  minClearance: number;
  minViaAnnularRing: number;
};

export type RuleCheck = (context: RuleContext) => RuleIssue[];

function issue(code: string, severity: RuleSeverity, message: string, meta?: RuleIssue["meta"]): RuleIssue {
  return {
    id: `${code}-${Math.random().toString(16).slice(2, 8)}`,
    code,
    severity,
    message,
    meta,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function checkTrackWidth(context: RuleContext): RuleIssue[] {
  return context.board.tracks
    .filter((track) => track.width < context.minTrackWidth)
    .map((track) =>
      issue("DRC_TRACK_WIDTH", "error", `Track ${track.id} width ${track.width} below minimum`, {
        trackId: track.id,
        width: track.width,
      }),
    );
}

function checkViaAnnular(context: RuleContext): RuleIssue[] {
  return context.board.vias
    .filter((via) => via.diameter - via.drill < context.minViaAnnularRing * 2)
    .map((via) =>
      issue(
        "DRC_VIA_ANNULAR",
        "error",
        `Via ${via.id} annular ring below minimum`,
        {
          viaId: via.id,
          drill: via.drill,
          diameter: via.diameter,
        },
      ),
    );
}

function checkComponentClearance(context: RuleContext): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const components = context.board.components;
  for (let i = 0; i < components.length; i += 1) {
    for (let j = i + 1; j < components.length; j += 1) {
      const a = components[i]!;
      const b = components[j]!;
      const d = distance(a, b);
      if (d < context.minClearance) {
        issues.push(
          issue(
            "DRC_COMPONENT_CLEARANCE",
            "warn",
            `Components ${a.ref} and ${b.ref} are too close`,
            { a: a.ref, b: b.ref, distance: d },
          ),
        );
      }
    }
  }
  return issues;
}

function checkTrackToViaClearance(context: RuleContext): RuleIssue[] {
  const issues: RuleIssue[] = [];
  for (const track of context.board.tracks) {
    for (const via of context.board.vias) {
      const nearStart = distance(track.from, via);
      const nearEnd = distance(track.to, via);
      const d = Math.min(nearStart, nearEnd);
      if (d < context.minClearance) {
        issues.push(
          issue(
            "DRC_TRACK_VIA_CLEARANCE",
            "warn",
            `Track ${track.id} too close to via ${via.id}`,
            { trackId: track.id, viaId: via.id, distance: d },
          ),
        );
      }
    }
  }
  return issues;
}

function checkZoneGeometry(context: RuleContext): RuleIssue[] {
  return context.board.zones
    .filter((zone) => zone.polygon.length < 3)
    .map((zone) => issue("DRC_ZONE_GEOMETRY", "error", `Zone ${zone.id} invalid polygon`, { zoneId: zone.id }));
}

function checkLayerCoverage(context: RuleContext): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const layerIds = new Set(context.board.layers.map((layer) => layer.id));
  for (const track of context.board.tracks) {
    if (!layerIds.has(track.layerId)) {
      issues.push(issue("DRC_LAYER_REF", "error", `Track ${track.id} references unknown layer`));
    }
  }
  for (const zone of context.board.zones) {
    if (!layerIds.has(zone.layerId)) {
      issues.push(issue("DRC_LAYER_REF", "error", `Zone ${zone.id} references unknown layer`));
    }
  }
  return issues;
}

const checks: RuleCheck[] = [
  checkTrackWidth,
  checkViaAnnular,
  checkComponentClearance,
  checkTrackToViaClearance,
  checkZoneGeometry,
  checkLayerCoverage,
];

export function runRuleEngine(context: RuleContext) {
  const issues = checks.flatMap((check) => check(context));
  const severityCounts = {
    info: issues.filter((issue) => issue.severity === "info").length,
    warn: issues.filter((issue) => issue.severity === "warn").length,
    error: issues.filter((issue) => issue.severity === "error").length,
  };

  return {
    issues,
    severityCounts,
    passes: severityCounts.error === 0,
  };
}

export function summarizeRuleReport(report: ReturnType<typeof runRuleEngine>) {
  if (report.issues.length === 0) {
    return "No rule violations";
  }
  return `${report.issues.length} issues (${report.severityCounts.error} errors, ${report.severityCounts.warn} warnings)`;
}
