import type { AppProject } from "../../domain/types";
import { runAutorouter, routeQualityScore } from "./autorouter";
import { boardStats, createBoard, placeComponent, addTrack, validateBoard } from "./board-kernel";
import { exportManufacturingPackage } from "./manufacturing-exports";
import { runRuleEngine, summarizeRuleReport } from "./rule-engine";
import { addSymbol, connectPins, createSheet, generateNetlist, summarizeSchematic, validateSchematic } from "./schematic-capture";
import { createIndustrialCatalog, queryIndustrialCatalog, summarizeIndustrialCatalog } from "./pcp-catalog";

type FlowRules = {
  minSpacingUm: number;
  gridStepUm: number;
};

export type PcpLifecycleReport = {
  hasDesignData: boolean;
  schematic: {
    valid: boolean;
    errors: number;
    symbolCount: number;
    netCount: number;
    nodeCount: number;
  };
  layout: {
    valid: boolean;
    issues: number;
    componentCount: number;
    trackCount: number;
    totalTrackLength: number;
  };
  routing: {
    requested: number;
    routed: number;
    totalCost: number;
    score: number;
  };
  drc: {
    passes: boolean;
    issueCount: number;
    summary: string;
  };
  manufacturing: {
    fileCount: number;
    formats: string[];
  };
  catalog: {
    total: number;
    active: number;
    candidates: number;
  };
};

function clampStep(step: number) {
  return Math.max(10, Math.round(step));
}

function clampSpacing(spacing: number, step: number) {
  return Math.max(step, Math.round(spacing));
}

function normalizedComponentPoints(project: AppProject, margin: number) {
  const source = Object.values(project.model.components);
  if (source.length === 0) {
    return [] as Array<{ id: string; ref: string; x: number; y: number }>;
  }

  const minX = Math.min(...source.map((component) => component.position.x));
  const minY = Math.min(...source.map((component) => component.position.y));

  return source.map((component, index) => ({
    id: component.id,
    ref: `U${index + 1}`,
    x: Math.round(component.position.x - minX + margin),
    y: Math.round(component.position.y - minY + margin),
  }));
}

export function buildPcpLifecycleReport(project: AppProject | null, rules: FlowRules): PcpLifecycleReport {
  if (!project) {
    return {
      hasDesignData: false,
      schematic: { valid: true, errors: 0, symbolCount: 0, netCount: 0, nodeCount: 0 },
      layout: { valid: true, issues: 0, componentCount: 0, trackCount: 0, totalTrackLength: 0 },
      routing: { requested: 0, routed: 0, totalCost: 0, score: 0 },
      drc: { passes: true, issueCount: 0, summary: "No rule violations" },
      manufacturing: { fileCount: 0, formats: [] },
      catalog: { total: 0, active: 0, candidates: 0 },
    };
  }

  const step = clampStep(rules.gridStepUm);
  const spacing = clampSpacing(rules.minSpacingUm, step);
  const points = normalizedComponentPoints(project, spacing * 2).slice(0, 48);

  if (points.length === 0) {
    return {
      hasDesignData: false,
      schematic: { valid: true, errors: 0, symbolCount: 0, netCount: 0, nodeCount: 0 },
      layout: { valid: true, issues: 0, componentCount: 0, trackCount: 0, totalTrackLength: 0 },
      routing: { requested: 0, routed: 0, totalCost: 0, score: 0 },
      drc: { passes: true, issueCount: 0, summary: "No rule violations" },
      manufacturing: { fileCount: 0, formats: [] },
      catalog: { total: 0, active: 0, candidates: 0 },
    };
  }

  const maxX = Math.max(...points.map((component) => component.x));
  const maxY = Math.max(...points.map((component) => component.y));
  let board = createBoard(maxX + spacing * 2, maxY + spacing * 2);

  for (const component of points) {
    board = placeComponent(board, {
      ref: component.ref,
      x: component.x,
      y: component.y,
      side: "top",
    });
  }

  let sheet = createSheet(project.name);
  for (const component of points) {
    sheet = addSymbol(sheet, {
      ref: component.ref,
      libId: "pcp:auto:symbol",
      x: component.x,
      y: component.y,
      rotation: 0,
      pins: [
        { id: "P1", name: "P1", x: 0, y: 0, direction: "bidirectional" },
        { id: "P2", name: "P2", x: 20, y: 0, direction: "bidirectional" },
      ],
      properties: { sourceComponentId: component.id },
    });
  }

  const netNames = Object.keys(project.model.nets);
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = sheet.symbols[index];
    const b = sheet.symbols[index + 1];
    if (!a || !b) {
      continue;
    }
    const netName = netNames[index] ?? `NET_${index + 1}`;
    sheet = connectPins(sheet, netName, { symbolId: a.id, pinId: "P2" }, { symbolId: b.id, pinId: "P1" });
  }

  const routeRequests = points.slice(0, -1).map((component, index) => ({
    net: `N_${index + 1}`,
    start: { x: component.x, y: component.y },
    end: { x: points[index + 1]!.x, y: points[index + 1]!.y },
  }));

  const autoRoute = runAutorouter(
    {
      width: board.width,
      height: board.height,
      step,
      blockedPoints: points.map((component) => ({ x: component.x, y: component.y })),
      ripupRetries: 2,
    },
    routeRequests,
  );

  const trackWidth = Math.max(10, Math.round(spacing / 2));
  for (const route of autoRoute.routes) {
    for (let index = 1; index < route.route.points.length; index += 1) {
      const from = route.route.points[index - 1];
      const to = route.route.points[index];
      if (!from || !to) {
        continue;
      }
      board = addTrack(board, {
        net: route.net,
        layerId: "L1",
        from,
        to,
        width: trackWidth,
      });
    }
  }

  const ruleReport = runRuleEngine({
    board,
    minTrackWidth: trackWidth,
    minClearance: spacing,
    minViaAnnularRing: Math.max(1, Math.round(step / 4)),
  });
  const schematicValidation = validateSchematic(sheet);
  const schematicSummary = summarizeSchematic(sheet);
  const layoutValidation = validateBoard(board);
  const layoutSummary = boardStats(board);
  const manufacturingPackage = exportManufacturingPackage(board);
  const netlist = generateNetlist(sheet);
  const catalog = createIndustrialCatalog(3000, points.length + step);
  const catalogSummary = summarizeIndustrialCatalog(catalog);
  const catalogCandidates = queryIndustrialCatalog(catalog, {
    lifecycle: "active",
    limit: Math.max(5, Math.min(200, points.length * 3)),
  }).length;

  return {
    hasDesignData: true,
    schematic: {
      valid: schematicValidation.valid,
      errors: schematicValidation.errors.length,
      symbolCount: schematicSummary.symbolCount,
      netCount: schematicSummary.netCount,
      nodeCount: netlist.reduce((sum, entry) => sum + entry.nodes.length, 0),
    },
    layout: {
      valid: layoutValidation.valid,
      issues: layoutValidation.issues.length,
      componentCount: layoutSummary.componentCount,
      trackCount: layoutSummary.trackCount,
      totalTrackLength: layoutSummary.totalTrackLength,
    },
    routing: {
      requested: autoRoute.summary.requested,
      routed: autoRoute.summary.routed,
      totalCost: autoRoute.summary.totalCost,
      score: routeQualityScore(autoRoute.routes),
    },
    drc: {
      passes: ruleReport.passes,
      issueCount: ruleReport.issues.length,
      summary: summarizeRuleReport(ruleReport),
    },
    manufacturing: {
      fileCount: manufacturingPackage.length,
      formats: Array.from(new Set(manufacturingPackage.map((entry) => entry.format))).sort(),
    },
    catalog: {
      total: catalogSummary.total,
      active: catalogSummary.active,
      candidates: catalogCandidates,
    },
  };
}
