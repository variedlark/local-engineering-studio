import { getProjectSnapshot, redo, undo } from "../ipc/client";
import type { AppProject } from "../domain/types";
import { prependActivity, prependLog } from "./ui-store.activity";
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

type TimelineStoreState = {
  busy: boolean;
  paletteOpen: boolean;
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
};

export function pruneTransientState<S extends TimelineStoreState>(state: S): Partial<S> {
  return {
    busy: false,
    paletteOpen: false,
    statusMessage: "Restored from replay",
    healthReport: null,
    activityEvents: prependActivity(
      state.activityEvents,
      "system",
      "info",
      "Replay",
      "Timeline replay applied",
    ),
  } as unknown as Partial<S>;
}

export async function undoAction<S extends TimelineStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  ensureProjectOptions: EnsureProjectOptions<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
    const result = await undo(projectId);
    if (!result.ok) {
      throw new Error(result.message ?? "Undo failed");
    }
    const snapshot = await getProjectSnapshot(projectId);
    set(
      (state) =>
        ({
          ...applySnapshotToState(state, snapshot, result.changed ? "Undo" : "Nothing to undo"),
          ...staleQualityState(),
          selectedComponentIds: state.selectedComponentIds,
          healthReport: state.healthReport,
          activityEvents: result.changed
            ? prependActivity(state.activityEvents, "command", "info", "Undo", "Reverted latest operation")
            : state.activityEvents,
          logs: result.changed ? prependLog(state.logs, "Undo") : state.logs,
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Undo failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function redoAction<S extends TimelineStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  ensureProjectOptions: EnsureProjectOptions<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
    const result = await redo(projectId);
    if (!result.ok) {
      throw new Error(result.message ?? "Redo failed");
    }
    const snapshot = await getProjectSnapshot(projectId);
    set(
      (state) =>
        ({
          ...applySnapshotToState(state, snapshot, result.changed ? "Redo" : "Nothing to redo"),
          ...staleQualityState(),
          selectedComponentIds: state.selectedComponentIds,
          healthReport: state.healthReport,
          activityEvents: result.changed
            ? prependActivity(state.activityEvents, "command", "info", "Redo", "Re-applied latest operation")
            : state.activityEvents,
          logs: result.changed ? prependLog(state.logs, "Redo") : state.logs,
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Redo failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}

export async function replayHistoryToAction<S extends TimelineStoreState>(
  set: SetState<S>,
  get: GetState<S>,
  index: number,
  ensureProjectOptions: EnsureProjectOptions<S>,
) {
  set({ busy: true } as unknown as Partial<S>);
  try {
    const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
    const state = get();
    const events = state.activityEvents;
    if (index < 0 || index >= events.length) {
      throw new Error("History index out of range");
    }

    const event = events[index];
    const snapshot = await getProjectSnapshot(projectId);
    set(
      (current) =>
        ({
          ...applySnapshotToState(current, snapshot, `Replay anchor: ${event.title}`),
          selectedComponentIds: current.selectedComponentIds,
          ...pruneTransientState(current),
        }) as unknown as Partial<S>,
    );
  } catch (error) {
    setStatusFromError(set, error, "Replay failed");
  } finally {
    set({ busy: false } as unknown as Partial<S>);
  }
}
