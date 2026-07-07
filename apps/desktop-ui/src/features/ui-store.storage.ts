import type {
  CanvasViewportState,
  WorkspacePreferences,
  WorkspacePreset,
} from "./ui-store.types";

const WORKSPACE_PREFS_STORAGE_KEY = "les.workspace.preferences.v1";
const WORKSPACE_PRESETS_STORAGE_KEY = "les.workspace.presets.v1";

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  autosaveIntervalSec: 45,
  coordinateStepUm: 500,
  showStatusHints: true,
  accent: "sky",
  density: "comfortable",
};

export function initialCanvasViewportState(): CanvasViewportState {
  return {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    showGrid: true,
    snapToGrid: false,
  };
}

export function clampZoom(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(0.3, Math.min(4, value));
}

function sanitizeBoundedInt(
  value: number,
  fallback: number,
  min: number,
  max: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function normalizeWorkspacePreferences(
  raw: Partial<WorkspacePreferences> | null | undefined,
): WorkspacePreferences {
  return {
    autosaveIntervalSec: sanitizeBoundedInt(
      raw?.autosaveIntervalSec ?? 45,
      45,
      5,
      3600,
    ),
    coordinateStepUm: sanitizeBoundedInt(
      raw?.coordinateStepUm ?? 500,
      500,
      1,
      1_000_000,
    ),
    showStatusHints: raw?.showStatusHints ?? true,
    accent:
      raw?.accent === "emerald" ||
      raw?.accent === "amber" ||
      raw?.accent === "sky"
        ? raw.accent
        : "sky",
    density:
      raw?.density === "compact" || raw?.density === "comfortable"
        ? raw.density
        : "comfortable",
  };
}

export function sameWorkspacePreferences(
  a: WorkspacePreferences,
  b: WorkspacePreferences,
) {
  return (
    a.autosaveIntervalSec === b.autosaveIntervalSec &&
    a.coordinateStepUm === b.coordinateStepUm &&
    a.showStatusHints === b.showStatusHints &&
    a.accent === b.accent &&
    a.density === b.density
  );
}

export type StorageDiagnostic = (error: {
  key: string;
  operation: "read" | "write";
  message: string;
}) => void;

export function normalizeCanvasViewportState(
  raw: Partial<CanvasViewportState> | null | undefined,
): CanvasViewportState {
  return {
    offsetX: Number.isFinite(raw?.offsetX) ? Number(raw?.offsetX) : 0,
    offsetY: Number.isFinite(raw?.offsetY) ? Number(raw?.offsetY) : 0,
    zoom: clampZoom(raw?.zoom ?? 1),
    showGrid: typeof raw?.showGrid === "boolean" ? raw.showGrid : true,
    snapToGrid: typeof raw?.snapToGrid === "boolean" ? raw.snapToGrid : false,
  };
}

export function readWorkspacePreferences(
  onPersistenceError?: StorageDiagnostic,
): WorkspacePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSPACE_PREFERENCES;
  }
  try {
    const raw = window.localStorage.getItem(WORKSPACE_PREFS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_WORKSPACE_PREFERENCES;
    }
    return normalizeWorkspacePreferences(
      JSON.parse(raw) as Partial<WorkspacePreferences>,
    );
  } catch (error) {
    onPersistenceError?.({
      key: WORKSPACE_PREFS_STORAGE_KEY,
      operation: "read",
      message:
        error instanceof Error ? error.message : "Unable to read preferences",
    });
    return DEFAULT_WORKSPACE_PREFERENCES;
  }
}

export function writeWorkspacePreferences(
  preferences: WorkspacePreferences,
  onPersistenceError?: StorageDiagnostic,
) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      WORKSPACE_PREFS_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch (error) {
    onPersistenceError?.({
      key: WORKSPACE_PREFS_STORAGE_KEY,
      operation: "write",
      message:
        error instanceof Error ? error.message : "Unable to write preferences",
    });
  }
}

export function readWorkspacePresets(
  onPersistenceError?: StorageDiagnostic,
): WorkspacePreset[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(WORKSPACE_PRESETS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WorkspacePreset[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (preset) =>
          typeof preset?.name === "string" && preset.name.trim().length > 0,
      )
      .map((preset) => ({
        name: preset.name.trim(),
        preferences: normalizeWorkspacePreferences(preset.preferences),
        viewport: normalizeCanvasViewportState(preset.viewport),
      }));
  } catch (error) {
    onPersistenceError?.({
      key: WORKSPACE_PRESETS_STORAGE_KEY,
      operation: "read",
      message:
        error instanceof Error ? error.message : "Unable to read presets",
    });
    return [];
  }
}

export function writeWorkspacePresets(
  presets: WorkspacePreset[],
  onPersistenceError?: StorageDiagnostic,
) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      WORKSPACE_PRESETS_STORAGE_KEY,
      JSON.stringify(presets),
    );
  } catch (error) {
    onPersistenceError?.({
      key: WORKSPACE_PRESETS_STORAGE_KEY,
      operation: "write",
      message:
        error instanceof Error ? error.message : "Unable to write presets",
    });
  }
}
