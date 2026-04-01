import { buildExportPackage, summarizeExportPackage } from "../export/export-plan";
import { createBoard, placeComponent, boardStats } from "./board-kernel";
import { runRuleEngine, summarizeRuleReport } from "./rule-engine";
import { runSimulationSuite, summarizeSimulation } from "./simulation-suite";

export type CliCommand =
  | { type: "create_demo_board"; projectName: string }
  | { type: "analyze_board" }
  | { type: "export_package"; projectName: string; revision: number };

export type CliRunResult = {
  ok: boolean;
  output: string[];
};

function createDemoBoard() {
  return placeComponent(createBoard(4000, 3000), {
    ref: "U1",
    x: 800,
    y: 700,
    side: "top",
  });
}

export function runCliCommand(command: CliCommand): CliRunResult {
  if (command.type === "create_demo_board") {
    const board = createDemoBoard();
    const stats = boardStats(board);
    return {
      ok: true,
      output: [
        `Created demo board for ${command.projectName}`,
        `Board stats: components=${stats.componentCount} layers=${stats.layerCount}`,
      ],
    };
  }

  if (command.type === "analyze_board") {
    const board = createDemoBoard();
    const rules = runRuleEngine({
      board,
      minTrackWidth: 60,
      minClearance: 100,
      minViaAnnularRing: 20,
    });
    const sim = runSimulationSuite({
      si: { lengthUm: 12000, riseTimeNs: 0.8, impedanceOhm: 50 },
      pi: { currentA: 0.6, resistanceOhm: 0.03, supplyV: 3.3 },
      thermal: { powerW: 0.8, thetaJa: 28, ambientC: 24 },
      timing: { pathDelayNs: 2, clockPeriodNs: 8, setupNs: 0.8, holdNs: 0.2 },
    });
    return {
      ok: true,
      output: [summarizeRuleReport(rules), summarizeSimulation(sim)],
    };
  }

  const pkg = buildExportPackage({
    projectName: command.projectName,
    revision: command.revision,
    qualityScore: 88,
    qualitySummary: "88/100",
    healthReport: null,
    notes: [],
    activityEvents: [],
  });

  return {
    ok: true,
    output: [summarizeExportPackage(pkg)],
  };
}
