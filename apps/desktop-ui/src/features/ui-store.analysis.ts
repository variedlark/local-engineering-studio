import {
  analyzeDrc,
  analyzeRoute,
  analyzeSimulation,
  getProjectSnapshot,
} from "../ipc/client";
import type { AppProject } from "../domain/types";
import { prependActivity, prependLog } from "./ui-store.activity";
import {
  ensureProjectExists,
  setStatusFromError,
  type EnsureProjectOptions,
  type GetState,
  type SetState,
} from "./ui-store.project";
import { qualitySummary, scoreQuality, staleQualityState } from "./ui-store.quality";
import { applySnapshotToState } from "./ui-store.snapshot";
import type { ActivityEvent, CanvasViewportState, HealthReport } from "./ui-store.types";

type AnalysisStoreState = {
  busy: boolean;
  projectId: string | null;
  project: AppProject | null;
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  routeEndpoints: { from: string | null; to: string | null };
  simulationConfig: { timeStep: number; steps: number; initialEnergy: number };
  statusMessage: string;
  drcViolations: number;
  routeStatus: string;
  routePath: Array<{ x: number; y: number }>;
  simulationSummary: string;
  qualityScore: number | null;
  qualitySummary: string;
  healthReport: HealthReport | null;
  activityEvents: ActivityEvent[];
  logs: string[];
  canvasViewport: CanvasViewportState;
};

export function qualityActivityStatus(score: number) {
  if (score >= 90) {
    return "ok";
  }
  if (score >= 70) {
    return "warn";
  }
  return "error";
}

export function healthSummaryFromQualityScore(score: number | null) {
  if (score === null) {
    return "Health report generated (quality pending)";
  }
  if (score >= 85) {
    return "Health report generated (strong)";
  }
  if (score >= 70) {
    return "Health report generated (watch)";
  }
  return "Health report generated (attention needed)";
}

export async function runDrcAction<S extends AnalysisStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  ensureProjectOptions: EnsureProjectOptions<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
    const report = await analyzeDrc(projectId);
    set(
      (state) =>
        ({
          drcViolations: report.violations.length,
          statusMessage: `DRC complete: ${report.violations.length} violations`,
          ...staleQualityState(),
          healthReport: state.healthReport,
          activityEvents: prependActivity(
            state.activityEvents,
            "analysis",
            report.violations.length === 0 ? "ok" : "warn",
            "DRC complete",
            `${report.violations.length} violations across ${report.checked_pairs} checked pairs`,
          ),
          logs: prependLog(state.logs, `DRC complete (${report.violations.length})`),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "DRC failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function runRouteAction<S extends AnalysisStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  ensureProjectOptions: EnsureProjectOptions<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
    const snapshot = await getProjectSnapshot(projectId);
    const { from, to } = get().routeEndpoints;
    if (!from || !to) {
      throw new Error("Need at least two components for routing");
    }

    const report = await analyzeRoute(projectId, from, to);
    const routePath = report.path
      .map((node) => `${node.x},${node.y}`)
      .join(" -> ")
      .slice(0, 180);

    set(
      (state) =>
        ({
          ...applySnapshotToState(state, snapshot),
          healthReport: state.healthReport,
          selectedComponentIds: state.selectedComponentIds,
          routePath: report.path,
          routeStatus: report.success ? `Path length ${report.path.length}` : "No route",
          statusMessage: report.success ? "Routing succeeded" : "Routing failed",
          ...staleQualityState(),
          activityEvents: prependActivity(
            state.activityEvents,
            "analysis",
            report.success ? "ok" : "warn",
            "Routing",
            report.success
              ? `Path length ${report.path.length}, expanded ${report.expanded_nodes}`
              : "No route found between endpoints",
          ),
          logs: prependLog(
            state.logs,
            `Routing ${report.success ? "succeeded" : "failed"}${routePath ? ` (${routePath})` : ""}`,
          ),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Routing failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function runSimulationAction<S extends AnalysisStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  ensureProjectOptions: EnsureProjectOptions<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
    const simulationConfig = get().simulationConfig;
    const report = await analyzeSimulation(projectId, {
      time_step: simulationConfig.timeStep,
      steps: simulationConfig.steps,
      initial_energy: simulationConfig.initialEnergy,
    });

    const peak = report.points.reduce((max, point) => Math.max(max, point.value), 0);
    set(
      (state) =>
        ({
          simulationSummary: report.summary,
          statusMessage: report.summary,
          ...staleQualityState(),
          healthReport: state.healthReport,
          activityEvents: prependActivity(
            state.activityEvents,
            "analysis",
            report.stable ? "ok" : "warn",
            "Simulation",
            `${report.stable ? "Stable" : "Unstable"}, points=${report.points.length}, peak=${peak.toFixed(3)}`,
          ),
          logs: prependLog(state.logs, `Simulation complete (peak=${peak.toFixed(3)})`),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Simulation failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function runQualitySuiteAction<S extends AnalysisStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  ensureProjectOptions: EnsureProjectOptions<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
    const snapshot = await getProjectSnapshot(projectId);
    const drc = await analyzeDrc(projectId);

    const componentIds = Object.keys(snapshot.model.components);
    let routeSuccess: boolean | null = null;
    let qualityRoutePath: Array<{ x: number; y: number }> = [];
    if (componentIds.length >= 2) {
      const route = await analyzeRoute(projectId, componentIds[0], componentIds[1]);
      routeSuccess = route.success;
      qualityRoutePath = route.path;
    }

    const simulationConfig = get().simulationConfig;
    const simulation = await analyzeSimulation(projectId, {
      time_step: simulationConfig.timeStep,
      steps: simulationConfig.steps,
      initial_energy: simulationConfig.initialEnergy,
    });

    const score = scoreQuality({
      drcViolations: drc.violations.length,
      routeSuccess,
      simulationStable: simulation.stable,
      componentCount: componentIds.length,
    });

    const summary = qualitySummary({
      score,
      drcViolations: drc.violations.length,
      routeSuccess,
      simulationStable: simulation.stable,
    });

    set(
      (state) =>
        ({
          ...applySnapshotToState(state, snapshot, `Quality suite complete: ${summary}`),
          healthReport: {
            generatedAt: Date.now(),
            summary: `Quality suite snapshot: ${summary}`,
            details: [
              `Project: ${snapshot.name}`,
              `Revision: ${snapshot.revision}`,
              `DRC violations: ${drc.violations.length}`,
              `Route success: ${routeSuccess === null ? "skipped" : routeSuccess ? "yes" : "no"}`,
              `Simulation stable: ${simulation.stable ? "yes" : "no"}`,
              `Quality score: ${score}/100`,
            ],
          },
          selectedComponentIds: state.selectedComponentIds,
          drcViolations: drc.violations.length,
          routeStatus:
            routeSuccess === null
              ? "Skipped (need >= 2 components)"
              : routeSuccess
                ? "Quality route ok"
                : "Quality route failed",
          routePath: qualityRoutePath,
          simulationSummary: simulation.summary,
          qualityScore: score,
          qualitySummary: summary,
          activityEvents: prependActivity(
            state.activityEvents,
            "quality",
            qualityActivityStatus(score),
            "Quality suite",
            summary,
          ),
          logs: prependLog(state.logs, `Quality suite complete (${summary})`),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Quality suite failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export function generateHealthReportAction<S extends AnalysisStoreState>(
  set: SetState<S>,
  defaultProjectName: string,
) {
  set(
    (state) => {
      const project = state.project;
      const details = [
        `Project: ${project?.name ?? defaultProjectName}`,
        `Revision: ${project?.revision ?? 0}`,
        `Components: ${Object.keys(project?.model.components ?? {}).length}`,
        `Nets: ${Object.keys(project?.model.nets ?? {}).length}`,
        `DRC violations: ${state.drcViolations}`,
        `Route: ${state.routeStatus}`,
        `Simulation: ${state.simulationSummary}`,
        `Quality: ${state.qualityScore === null ? "stale" : `${state.qualityScore}/100`}`,
        `Activity events: ${state.activityEvents.length}`,
      ];
      const summary = healthSummaryFromQualityScore(state.qualityScore);

      return {
        healthReport: {
          generatedAt: Date.now(),
          summary,
          details,
        },
        selectedComponentIds: state.selectedComponentIds,
        statusMessage: summary,
        activityEvents: prependActivity(state.activityEvents, "system", "info", "Health report", summary),
      } as unknown as Partial<S>;
    },
  );
}
