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

function sanitizePositiveInt(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : fallback;
}

export function normalizeWorkspacePreferences(
  raw: Partial<WorkspacePreferences> | null | undefined,
): WorkspacePreferences {
  return {
    autosaveIntervalSec: sanitizePositiveInt(raw?.autosaveIntervalSec ?? 45, 45),
    coordinateStepUm: sanitizePositiveInt(raw?.coordinateStepUm ?? 500, 500),
    showStatusHints: raw?.showStatusHints ?? true,
    accent:
      raw?.accent === "emerald" || raw?.accent === "amber" || raw?.accent === "sky"
        ? raw.accent
        : "sky",
    density: raw?.density === "compact" || raw?.density === "comfortable" ? raw.density : "comfortable",
  };
}

export function sameWorkspacePreferences(a: WorkspacePreferences, b: WorkspacePreferences) {
  return (
    a.autosaveIntervalSec === b.autosaveIntervalSec &&
    a.coordinateStepUm === b.coordinateStepUm &&
    a.showStatusHints === b.showStatusHints &&
    a.accent === b.accent &&
    a.density === b.density
  );
}

export function readWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSPACE_PREFERENCES;
  }
  try {
    const raw = window.localStorage.getItem(WORKSPACE_PREFS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_WORKSPACE_PREFERENCES;
    }
    return normalizeWorkspacePreferences(JSON.parse(raw) as Partial<WorkspacePreferences>);
  } catch {
    return DEFAULT_WORKSPACE_PREFERENCES;
  }
}

export function writeWorkspacePreferences(preferences: WorkspacePreferences) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(WORKSPACE_PREFS_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // ignore localStorage failures
  }
}

export function readWorkspacePresets(): WorkspacePreset[] {
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
      .filter((preset) => typeof preset?.name === "string" && preset.name.trim().length > 0)
      .map((preset) => ({
        name: preset.name.trim(),
        preferences: normalizeWorkspacePreferences(preset.preferences),
        viewport: {
          ...initialCanvasViewportState(),
          ...preset.viewport,
          zoom: clampZoom(preset.viewport?.zoom ?? 1),
        },
      }));
  } catch {
    return [];
  }
}

export function writeWorkspacePresets(presets: WorkspacePreset[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(WORKSPACE_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore localStorage failures
  }
}
