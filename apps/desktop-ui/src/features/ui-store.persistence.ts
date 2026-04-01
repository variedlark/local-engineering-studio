import {
  autosaveProject,
  executeCommand,
  exportProject,
  getProjectSnapshot,
  importProject,
  saveProject,
} from "../ipc/client";
import type { AppProject } from "../domain/types";
import { prependActivity, prependLog } from "./ui-store.activity";
import { ensureOk } from "./ui-store.commands";
import { sanitizePositiveInt } from "./ui-store.numeric";
import {
  ensureProjectExists,
  setStatusFromError,
  type EnsureProjectOptions,
  type GetState,
  type SetState,
} from "./ui-store.project";
import { staleQualityState } from "./ui-store.quality";
import { applySnapshotToState } from "./ui-store.snapshot";
import type { ActivityEvent, CanvasViewportState, HealthReport } from "./ui-store.types";

type PersistenceStoreState = {
  busy: boolean;
  projectId: string | null;
  project: AppProject | null;
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  routeEndpoints: { from: string | null; to: string | null };
  statusMessage: string;
  healthReport: HealthReport | null;
  activityEvents: ActivityEvent[];
  logs: string[];
  canvasViewport: CanvasViewportState;
  rules: { minSpacingUm: number; gridStepUm: number };
};

type PersistenceConfig<S> = {
  ensureProjectOptions: EnsureProjectOptions<S>;
  bundleRoot: string;
};

export function buildExportPath(bundleRoot: string, projectId: string, format: "json" | "svg") {
  if (format === "json") {
    return `${bundleRoot}/${projectId}/exports/project-export.json`;
  }
  return `${bundleRoot}/${projectId}/exports/layout.svg`;
}

export function normalizeRules(minSpacingUm: number, gridStepUm: number) {
  const spacing = sanitizePositiveInt(minSpacingUm, 100);
  const grid = sanitizePositiveInt(gridStepUm, 50);
  if (spacing % grid !== 0) {
    throw new Error("Minimum spacing must be an integer multiple of grid step");
  }
  return { spacing, grid };
}

export async function saveProjectAction<S extends PersistenceStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  config: PersistenceConfig<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, config.ensureProjectOptions);
    await saveProject(projectId, config.bundleRoot);
    const snapshot = await getProjectSnapshot(projectId);
    set(
      (state) =>
        ({
          ...applySnapshotToState(state, snapshot, "Project saved"),
          healthReport: state.healthReport,
          selectedComponentIds: state.selectedComponentIds,
          activityEvents: prependActivity(
            state.activityEvents,
            "system",
            "ok",
            "Project saved",
            `Revision ${snapshot.revision}`,
          ),
          logs: prependLog(state.logs, "Saved"),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Save failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function autosaveProjectAction<S extends PersistenceStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  config: PersistenceConfig<S>,
) {
  try {
    const projectId = await ensureProjectExists(set, get, config.ensureProjectOptions);
    await autosaveProject(projectId, config.bundleRoot);
    const snapshot = await getProjectSnapshot(projectId);
    set(
      (state) =>
        ({
          ...applySnapshotToState(state, snapshot, "Autosaved"),
          healthReport: state.healthReport,
          selectedComponentIds: state.selectedComponentIds,
          activityEvents: prependActivity(
            state.activityEvents,
            "system",
            "info",
            "Autosave",
            `Revision ${snapshot.revision}`,
          ),
          logs: prependLog(state.logs, "Autosaved"),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Autosave failed");
  }
}

export async function updateRulesAction<S extends PersistenceStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  rules: { minSpacingUm: number; gridStepUm: number },
  config: PersistenceConfig<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const { spacing, grid } = normalizeRules(rules.minSpacingUm, rules.gridStepUm);
    const projectId = await ensureProjectExists(set, get, config.ensureProjectOptions);
    const result = await executeCommand(projectId, {
      type: "set_rules",
      min_spacing_um: spacing,
      grid_step_um: grid,
    });
    ensureOk(result, "Update rules failed");
    const snapshot = await getProjectSnapshot(projectId);
    set(
      (state) =>
        ({
          ...applySnapshotToState(state, snapshot, "Rules updated"),
          healthReport: state.healthReport,
          selectedComponentIds: state.selectedComponentIds,
          ...staleQualityState(),
          activityEvents: prependActivity(
            state.activityEvents,
            "command",
            "ok",
            "Rules updated",
            `Spacing ${spacing}um, grid ${grid}um`,
          ),
          logs: prependLog(state.logs, "Rules updated"),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Update rules failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function exportJsonAction<S extends PersistenceStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  config: PersistenceConfig<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, config.ensureProjectOptions);
    const path = buildExportPath(config.bundleRoot, projectId, "json");
    const stats = await exportProject(projectId, path, "json");
    set(
      (state) =>
        ({
          statusMessage: `Exported JSON (${stats.components} components)`,
          healthReport: state.healthReport,
          selectedComponentIds: state.selectedComponentIds,
          activityEvents: prependActivity(
            state.activityEvents,
            "system",
            "ok",
            "Export JSON",
            `${path} (${stats.components} components, ${stats.nets} nets)`,
          ),
          logs: prependLog(state.logs, "Exported JSON"),
        }) as unknown as Partial<S>,
    );
    await autosaveProject(projectId, config.bundleRoot);
  } catch (error) {
    setStatusFromError(set, error, "Export JSON failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function exportSvgAction<S extends PersistenceStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  config: PersistenceConfig<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, config.ensureProjectOptions);
    const path = buildExportPath(config.bundleRoot, projectId, "svg");
    const stats = await exportProject(projectId, path, "svg");
    set(
      (state) =>
        ({
          statusMessage: `Exported SVG (${stats.components} components)`,
          healthReport: state.healthReport,
          selectedComponentIds: state.selectedComponentIds,
          activityEvents: prependActivity(
            state.activityEvents,
            "system",
            "ok",
            "Export SVG",
            `${path} (${stats.components} components, ${stats.nets} nets)`,
          ),
          logs: prependLog(state.logs, "Exported SVG"),
        }) as unknown as Partial<S>,
    );
    await autosaveProject(projectId, config.bundleRoot);
  } catch (error) {
    setStatusFromError(set, error, "Export SVG failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function importJsonAction<S extends PersistenceStoreState>(
  set: SetState<S>,
  config: PersistenceConfig<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const imported = await importProject(`${config.bundleRoot}/import/project-export.json`, "Imported Project");
    const snapshot = await getProjectSnapshot(imported.project_id);
    set(
      (state) =>
        ({
          projectId: imported.project_id,
          ...applySnapshotToState(state, snapshot, "Imported project"),
          selectedComponentIds: Object.keys(snapshot.model.components).slice(0, 1),
          healthReport: null,
          ...config.ensureProjectOptions.initialAnalysisState(),
          ...config.ensureProjectOptions.staleQualityState(),
          canvasViewport: config.ensureProjectOptions.initialCanvasViewportState(),
          activityEvents: prependActivity(
            state.activityEvents,
            "system",
            "ok",
            "Import JSON",
            `Opened imported project ${imported.project_id.slice(0, 8)}`,
          ),
          logs: prependLog(state.logs, "Imported project JSON"),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Import failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}
