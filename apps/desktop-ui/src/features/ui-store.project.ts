import {
  createProject,
  getProjectSnapshot,
  listOpenProjects,
  openProject,
} from "../ipc/client";
import { prependActivity, prependLog } from "./ui-store.activity";
import { applySnapshotToState, dedupeSelection } from "./ui-store.snapshot";
import type {
  ActivityEvent,
  ActivityKind,
  ActivityStatus,
  CanvasViewportState,
  HealthReport,
} from "./ui-store.types";

type ProjectStoreState = {
  projectId: string | null;
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  routeEndpoints: { from: string | null; to: string | null };
  statusMessage: string;
  healthReport: HealthReport | null;
  activityEvents: ActivityEvent[];
  logs: string[];
  canvasViewport: CanvasViewportState;
};

type ProjectActivity = {
  kind: ActivityKind;
  status: ActivityStatus;
  title: string;
  detail: string;
};

export type SnapshotMutationOptions = {
  statusMessage: string;
  log: string;
  activity?: ProjectActivity;
  selectedComponentId?: string | null;
  selectedComponentIds?: string[];
};

export type SetState<S> = (partial: Partial<S> | ((state: S) => Partial<S>)) => void;
export type GetState<S> = () => S;

export type EnsureProjectOptions<S> = {
  defaultProjectName: string;
  bundleRoot: string;
  initialCanvasViewportState: () => CanvasViewportState;
  initialAnalysisState: () => Partial<S>;
  staleQualityState: () => Partial<S>;
};

export async function ensureProjectExists<S extends ProjectStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  options: EnsureProjectOptions<S>,
) {
  const existing = get().projectId;
  if (existing) {
    return existing;
  }

  const opened = await listOpenProjects();
  if (opened.projects.length > 0) {
    const current = opened.projects[0];
    await openProject(current.project_id, options.bundleRoot);
    set((state) => ({
      projectId: current.project_id,
      ...applySnapshotToState(state, current, "Project loaded"),
      selectedComponentIds: Object.keys(current.model.components).slice(0, 1),
      healthReport: null,
      ...options.initialAnalysisState(),
      ...options.staleQualityState(),
      canvasViewport: options.initialCanvasViewportState(),
      activityEvents: prependActivity(
        state.activityEvents,
        "system",
        "info",
        "Project loaded",
        `Opened ${current.name} (${current.project_id.slice(0, 8)})`,
      ),
      logs: [`[${new Date().toLocaleTimeString()}] Project loaded`],
    }));
    return current.project_id;
  }

  const created = await createProject(options.defaultProjectName);
  await openProject(created.project_id, options.bundleRoot);
  const snapshot = await getProjectSnapshot(created.project_id);
  set((state) => ({
    projectId: created.project_id,
    ...applySnapshotToState(state, snapshot, "Project created"),
    selectedComponentIds: Object.keys(snapshot.model.components).slice(0, 1),
    healthReport: null,
    ...options.initialAnalysisState(),
    ...options.staleQualityState(),
    canvasViewport: options.initialCanvasViewportState(),
    activityEvents: prependActivity(
      state.activityEvents,
      "system",
      "ok",
      "Project created",
      `Created ${snapshot.name} (${created.project_id.slice(0, 8)})`,
    ),
    logs: [`[${new Date().toLocaleTimeString()}] Project created`],
  }));
  return created.project_id;
}

export async function runSnapshotMutation<S extends ProjectStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  options: SnapshotMutationOptions,
  ensureOptions: EnsureProjectOptions<S>,
) {
  const projectId = await ensureProjectExists(set, get, ensureOptions);
  const snapshot = await getProjectSnapshot(projectId);
  set((state) => {
    const next = applySnapshotToState(
      {
        ...state,
        selectedComponentId:
          options.selectedComponentId !== undefined ? options.selectedComponentId : state.selectedComponentId,
        selectedComponentIds:
          options.selectedComponentIds !== undefined ? options.selectedComponentIds : state.selectedComponentIds,
      },
      snapshot,
      options.statusMessage,
    );

    const nextSelectedIds =
      options.selectedComponentIds !== undefined
        ? dedupeSelection(options.selectedComponentIds)
        : state.selectedComponentIds;

    return {
      ...next,
      selectedComponentIds: nextSelectedIds,
      selectedComponentId: nextSelectedIds[0] ?? null,
      healthReport: state.healthReport,
      ...ensureOptions.staleQualityState(),
      activityEvents: options.activity
        ? prependActivity(
            state.activityEvents,
            options.activity.kind,
            options.activity.status,
            options.activity.title,
            options.activity.detail,
          )
        : state.activityEvents,
      logs: prependLog(state.logs, options.log),
    };
  });
}

type ErrorState = {
  statusMessage: string;
  activityEvents: ActivityEvent[];
};

export function setStatusFromError<S extends ErrorState>(
  set: SetState<S>,
  error: unknown,
  fallbackMessage: string,
) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  set((state) => ({
    statusMessage: message,
    activityEvents: prependActivity(state.activityEvents, "system", "error", "Operation failed", message),
  }) as Partial<S>);
}
