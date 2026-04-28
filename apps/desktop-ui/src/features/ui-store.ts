import { create } from "zustand";
import type { DomainCommand, NonBatchDomainCommand } from "@ipc/index";
import {
  executeCommand,
  getProjectSnapshot,
  openProject,
} from "../ipc/client";
import type { AppProject } from "../domain/types";
import { applyAlignment, applyDistribution } from "./ui-store.layout";
import {
  clampZoom,
  initialCanvasViewportState,
  normalizeWorkspacePreferences,
  readWorkspacePreferences,
  readWorkspacePresets,
  sameWorkspacePreferences,
  writeWorkspacePreferences,
  writeWorkspacePresets,
} from "./ui-store.storage";
import {
  DEFAULT_PROJECT_NAME,
  type ActivityEvent,
  type CanvasViewportState,
  type CanvasViewMode,
  type ComponentTemplatePreset,
  type HealthReport,
  type SelectionAlignMode,
  type SelectionDistributeAxis,
  type WorkspacePreferences,
  type WorkspacePreset,
} from "./ui-store.types";
import {
  batchMoveSelection,
  clampLayer,
  collectSelectedComponents,
  copyName,
  createComponentId,
  ensureOk,
  nextUniqueName,
  nonEmpty,
  projectStep,
  snapCoordinate,
  templateBaseName,
  templatePoints,
} from "./ui-store.commands";
import { prependActivity, prependLog } from "./ui-store.activity";
import {
  generateHealthReportAction,
  runDrcAction,
  runQualitySuiteAction,
  runRouteAction,
  runSimulationAction,
} from "./ui-store.analysis";
import {
  autosaveProjectAction,
  exportJsonAction,
  exportSvgAction,
  importJsonAction,
  saveProjectAction,
  updateRulesAction,
} from "./ui-store.persistence";
import {
  redoAction,
  replayHistoryToAction,
  undoAction,
} from "./ui-store.timeline";
import { staleQualityState } from "./ui-store.quality";
import {
  applySnapshotToState,
  dedupeSelection,
  firstComponentId,
  resolveSelectedComponentId,
} from "./ui-store.snapshot";
import {
  ensureProjectExists,
  runSnapshotMutation,
  setStatusFromError,
  type EnsureProjectOptions,
} from "./ui-store.project";
import {
  sanitizeNonNegativeFloat,
  sanitizePositiveFloat,
  sanitizePositiveInt,
} from "./ui-store.numeric";

export { DEFAULT_PROJECT_NAME } from "./ui-store.types";
export type {
  ActivityEvent,
  ActivityKind,
  ActivityStatus,
  CanvasViewportState,
  CanvasViewMode,
  ComponentTemplatePreset,
  HealthReport,
  SelectionAlignMode,
  SelectionDistributeAxis,
  WorkspacePreferences,
  WorkspacePreset,
} from "./ui-store.types";

const DEFAULT_BUNDLE_ROOT = "./local-projects";

type UiState = {
  paletteOpen: boolean;
  projectId: string | null;
  project: AppProject | null;
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  statusMessage: string;
  busy: boolean;
  drcViolations: number;
  routeStatus: string;
  routePath: Array<{ x: number; y: number }>;
  routeEndpoints: { from: string | null; to: string | null };
  simulationSummary: string;
  qualityScore: number | null;
  qualitySummary: string;
  simulationConfig: { timeStep: number; steps: number; initialEnergy: number };
  workspacePreferences: WorkspacePreferences;
  workspacePresets: WorkspacePreset[];
  canvasViewport: CanvasViewportState;
  viewMode: CanvasViewMode;
  healthReport: HealthReport | null;
  rules: { minSpacingUm: number; gridStepUm: number };
  logs: string[];
  activityEvents: ActivityEvent[];
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  selectComponent: (componentId: string | null) => void;
  selectComponents: (componentIds: string[]) => void;
  toggleComponentSelection: (componentId: string) => void;
  clearSelection: () => void;
  setRouteEndpoints: (from: string | null, to: string | null) => void;
  setSimulationConfig: (config: {
    timeStep?: number;
    steps?: number;
    initialEnergy?: number;
  }) => void;
  setCanvasViewport: (viewport: Partial<CanvasViewportState>) => void;
  setViewMode: (mode: CanvasViewMode) => void;
  setCanvasOffset: (offsetX: number, offsetY: number) => void;
  panCanvasBy: (dx: number, dy: number) => void;
  zoomCanvasBy: (factor: number) => void;
  resetCanvasViewport: () => void;
  toggleCanvasGrid: () => void;
  toggleCanvasSnap: () => void;
  updateWorkspacePreferences: (patch: Partial<WorkspacePreferences>) => void;
  saveWorkspacePreset: (name: string) => void;
  applyWorkspacePreset: (name: string) => void;
  deleteWorkspacePreset: (name: string) => void;
  clearLogs: () => void;
  clearActivity: () => void;
  renameProject: (name: string) => Promise<void>;
  bootstrap: () => Promise<void>;
  placeComponent: () => Promise<void>;
  placeTemplate: (template: ComponentTemplatePreset) => Promise<void>;
  duplicateSelected: () => Promise<void>;
  renameSelected: (name: string) => Promise<void>;
  moveMany: (entries: Array<{ componentId: string; x: number; y: number }>) => Promise<void>;
  moveComponentTo: (componentId: string, x: number, y: number) => Promise<void>;
  alignSelection: (mode: SelectionAlignMode) => Promise<void>;
  distributeSelection: (axis: SelectionDistributeAxis) => Promise<void>;
  moveSelected: (x: number, y: number) => Promise<void>;
  setSelectedLayer: (layer: number) => Promise<void>;
  deleteSelected: () => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  save: () => Promise<void>;
  autosave: () => Promise<void>;
  runDrc: () => Promise<void>;
  runRoute: () => Promise<void>;
  runSimulation: () => Promise<void>;
  runQualitySuite: () => Promise<void>;
  generateHealthReport: () => void;
  replayHistoryTo: (index: number) => Promise<void>;
  updateRules: (rules: { minSpacingUm: number; gridStepUm: number }) => Promise<void>;
  exportJson: () => Promise<void>;
  exportSvg: () => Promise<void>;
  importJson: () => Promise<void>;
};

function initialAnalysisState() {
  return {
    drcViolations: 0,
    routeStatus: "Not run",
    routePath: [] as Array<{ x: number; y: number }>,
    simulationSummary: "Not run",
  };
}

const ensureProjectOptions: EnsureProjectOptions<UiState> = {
  defaultProjectName: DEFAULT_PROJECT_NAME,
  bundleRoot: DEFAULT_BUNDLE_ROOT,
  initialCanvasViewportState,
  initialAnalysisState,
  staleQualityState,
};

export const useUiStore = create<UiState>((set, get) => ({
  paletteOpen: false,
  projectId: null,
  project: null,
  selectedComponentId: null,
  selectedComponentIds: [],
  statusMessage: "Starting...",
  busy: false,
  ...initialAnalysisState(),
  ...staleQualityState(),
  canvasViewport: initialCanvasViewportState(),
  viewMode: "2d",
  routeEndpoints: { from: null, to: null },
  simulationConfig: { timeStep: 0.02, steps: 256, initialEnergy: 1 },
  workspacePreferences: readWorkspacePreferences(),
  workspacePresets: readWorkspacePresets(),
  rules: { minSpacingUm: 100, gridStepUm: 50 },
  healthReport: null,
  logs: [],
  activityEvents: [],

  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
  selectComponent: (componentId) =>
    set((state) => {
      const desired = componentId ?? null;
      const project = state.project;
    if (!project) {
      return {
        selectedComponentId: desired,
        selectedComponentIds: desired ? [desired] : [],
        healthReport: state.healthReport,
      };
    }
      const selected = resolveSelectedComponentId(desired, project.model.components);
      const to =
        state.routeEndpoints.to && project.model.components[state.routeEndpoints.to]
          ? state.routeEndpoints.to
          : selected;
      return {
        selectedComponentId: selected,
        selectedComponentIds: selected ? [selected] : [],
        healthReport: state.healthReport,
        routeEndpoints: {
          from: selected,
          to,
        },
      };
    }),
  selectComponents: (componentIds) =>
    set((state) => {
      const project = state.project;
      if (!project) {
        const deduped = dedupeSelection(componentIds);
        return {
          selectedComponentId: deduped[0] ?? null,
          selectedComponentIds: deduped,
          healthReport: state.healthReport,
        };
      }
      const deduped = dedupeSelection(
        componentIds.filter((componentId) => Boolean(project.model.components[componentId])),
      );
      const primary = deduped[0] ?? null;
      return {
        selectedComponentId: primary,
        selectedComponentIds: deduped,
        healthReport: state.healthReport,
      };
    }),
  toggleComponentSelection: (componentId) =>
    set((state) => {
      const project = state.project;
      if (!project || !project.model.components[componentId]) {
        return {};
      }
      const has = state.selectedComponentIds.includes(componentId);
      const next = has
        ? state.selectedComponentIds.filter((id) => id !== componentId)
        : [...state.selectedComponentIds, componentId];
      const deduped = dedupeSelection(next);
      return {
        selectedComponentId: deduped[0] ?? null,
        selectedComponentIds: deduped,
        healthReport: state.healthReport,
      };
    }),
  clearSelection: () =>
    set({
      selectedComponentId: null,
      selectedComponentIds: [],
      healthReport: get().healthReport,
    }),
  alignSelection: async (mode) => {
    set({ busy: true });
    try {
      const state = get();
      const selected = collectSelectedComponents(state);
      if (selected.length < 2) {
        throw new Error("Select at least two components to align");
      }
      const entries = applyAlignment(selected, mode);
      const batch = batchMoveSelection(state, entries, `align_${mode}`);
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const result = await executeCommand(projectId, {
        type: "batch",
        label: batch.label,
        commands: batch.commands,
      });
      ensureOk(result, "Alignment failed");
      await runSnapshotMutation(set, get, {
        statusMessage: `Selection aligned (${mode})`,
        log: `Aligned ${selected.length} components (${mode})`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Align selection",
          detail: `${mode} (${selected.length} components)`,
        },
        selectedComponentIds: batch.selectedIds,
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Alignment failed");
    } finally {
      set({ busy: false });
    }
  },
  distributeSelection: async (axis) => {
    set({ busy: true });
    try {
      const state = get();
      const selected = collectSelectedComponents(state);
      if (selected.length < 3) {
        throw new Error("Select at least three components to distribute");
      }
      const entries = applyDistribution(selected, axis);
      const batch = batchMoveSelection(state, entries, `distribute_${axis}`);
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const result = await executeCommand(projectId, {
        type: "batch",
        label: batch.label,
        commands: batch.commands,
      });
      ensureOk(result, "Distribution failed");
      await runSnapshotMutation(set, get, {
        statusMessage: `Selection distributed (${axis})`,
        log: `Distributed ${selected.length} components (${axis})`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Distribute selection",
          detail: `${axis} (${selected.length} components)`,
        },
        selectedComponentIds: batch.selectedIds,
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Distribution failed");
    } finally {
      set({ busy: false });
    }
  },
  setRouteEndpoints: (from, to) =>
    set((state) => {
      const project = state.project;
      if (!project) {
        return { routeEndpoints: { from, to } };
      }
      const components = project.model.components;
      const resolvedFrom = from && components[from] ? from : firstComponentId(components);
      const resolvedTo = to && components[to] ? to : resolvedFrom;
      return { routeEndpoints: { from: resolvedFrom, to: resolvedTo } };
    }),
  setSimulationConfig: (config) =>
    set((state) => ({
      simulationConfig: {
        timeStep:
          config.timeStep !== undefined
            ? sanitizePositiveFloat(config.timeStep, state.simulationConfig.timeStep, 0.0001)
            : state.simulationConfig.timeStep,
        steps:
          config.steps !== undefined
            ? sanitizePositiveInt(config.steps, state.simulationConfig.steps)
            : state.simulationConfig.steps,
        initialEnergy:
          config.initialEnergy !== undefined
            ? sanitizeNonNegativeFloat(config.initialEnergy, state.simulationConfig.initialEnergy)
            : state.simulationConfig.initialEnergy,
      },
      ...staleQualityState(),
    })),
  setCanvasViewport: (viewport) =>
    set((state) => ({
      canvasViewport: {
        offsetX:
          viewport.offsetX !== undefined
            ? Math.round(viewport.offsetX)
            : state.canvasViewport.offsetX,
        offsetY:
          viewport.offsetY !== undefined
            ? Math.round(viewport.offsetY)
            : state.canvasViewport.offsetY,
        zoom:
          viewport.zoom !== undefined ? clampZoom(viewport.zoom) : state.canvasViewport.zoom,
        showGrid:
          viewport.showGrid !== undefined ? viewport.showGrid : state.canvasViewport.showGrid,
        snapToGrid:
          viewport.snapToGrid !== undefined
            ? viewport.snapToGrid
            : state.canvasViewport.snapToGrid,
      },
      healthReport: state.healthReport,
    })),
  setViewMode: (mode) =>
    set((state) => ({
      viewMode: mode,
      statusMessage: `View switched to ${mode.toUpperCase()}`,
      activityEvents: prependActivity(
        state.activityEvents,
        "system",
        "info",
        "View Mode",
        `Switched to ${mode.toUpperCase()}`,
      ),
    })),
  setCanvasOffset: (offsetX, offsetY) =>
    set((state) => ({
      canvasViewport: {
        ...state.canvasViewport,
        offsetX: Math.round(offsetX),
        offsetY: Math.round(offsetY),
      },
      healthReport: state.healthReport,
    })),
  panCanvasBy: (dx, dy) =>
    set((state) => ({
      canvasViewport: {
        ...state.canvasViewport,
        offsetX: Math.round(state.canvasViewport.offsetX + dx),
        offsetY: Math.round(state.canvasViewport.offsetY + dy),
      },
      healthReport: state.healthReport,
    })),
  zoomCanvasBy: (factor) =>
    set((state) => ({
      canvasViewport: {
        ...state.canvasViewport,
        zoom: clampZoom(state.canvasViewport.zoom * factor),
      },
      healthReport: state.healthReport,
    })),
  resetCanvasViewport: () =>
    set((state) => ({
      canvasViewport: initialCanvasViewportState(),
      statusMessage: "Canvas viewport reset",
      healthReport: state.healthReport,
      activityEvents: prependActivity(
        state.activityEvents,
        "system",
        "info",
        "Canvas reset",
        "Viewport pan and zoom reset to defaults",
      ),
    })),
  toggleCanvasGrid: () =>
    set((state) => ({
      canvasViewport: {
        ...state.canvasViewport,
        showGrid: !state.canvasViewport.showGrid,
      },
      healthReport: state.healthReport,
    })),
  toggleCanvasSnap: () =>
    set((state) => ({
      canvasViewport: {
        ...state.canvasViewport,
        snapToGrid: !state.canvasViewport.snapToGrid,
      },
      statusMessage: state.canvasViewport.snapToGrid ? "Snap to grid disabled" : "Snap to grid enabled",
      activityEvents: prependActivity(
        state.activityEvents,
        "system",
        "info",
        state.canvasViewport.snapToGrid ? "Snap disabled" : "Snap enabled",
        state.canvasViewport.snapToGrid
          ? "Components now move freely"
          : "Component moves now align to workspace step",
      ),
    })),
  updateWorkspacePreferences: (patch) =>
    set((state) => {
      const next = normalizeWorkspacePreferences({
        ...state.workspacePreferences,
        ...patch,
      });
      if (sameWorkspacePreferences(next, state.workspacePreferences)) {
        return {};
      }
      writeWorkspacePreferences(next);
      return {
        workspacePreferences: next,
        healthReport: state.healthReport,
        activityEvents: prependActivity(
          state.activityEvents,
          "system",
          "ok",
          "Preferences updated",
          `Autosave ${next.autosaveIntervalSec}s | Step ${next.coordinateStepUm}um | Accent ${next.accent}`,
        ),
      };
    }),
  saveWorkspacePreset: (name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return state;
      }
      const preset: WorkspacePreset = {
        name: trimmed,
        preferences: state.workspacePreferences,
        viewport: state.canvasViewport,
      };
      const withoutExisting = state.workspacePresets.filter(
        (entry) => entry.name.toLowerCase() !== trimmed.toLowerCase(),
      );
      const nextPresets = [preset, ...withoutExisting].slice(0, 24);
      writeWorkspacePresets(nextPresets);
      return {
        workspacePresets: nextPresets,
        statusMessage: `Preset saved: ${trimmed}`,
        healthReport: state.healthReport,
        activityEvents: prependActivity(
          state.activityEvents,
          "system",
          "ok",
          "Preset saved",
          trimmed,
        ),
      };
    }),
  applyWorkspacePreset: (name) =>
    set((state) => {
      const preset = state.workspacePresets.find((entry) => entry.name === name);
      if (!preset) {
        return state;
      }
      writeWorkspacePreferences(preset.preferences);
      return {
        workspacePreferences: preset.preferences,
        canvasViewport: {
          ...initialCanvasViewportState(),
          ...preset.viewport,
          zoom: clampZoom(preset.viewport.zoom),
        },
        statusMessage: `Preset applied: ${preset.name}`,
        healthReport: state.healthReport,
        activityEvents: prependActivity(
          state.activityEvents,
          "system",
          "info",
          "Preset applied",
          preset.name,
        ),
      };
    }),
  deleteWorkspacePreset: (name) =>
    set((state) => {
      const nextPresets = state.workspacePresets.filter((entry) => entry.name !== name);
      if (nextPresets.length === state.workspacePresets.length) {
        return state;
      }
      writeWorkspacePresets(nextPresets);
      return {
        workspacePresets: nextPresets,
        statusMessage: `Preset deleted: ${name}`,
        healthReport: state.healthReport,
        activityEvents: prependActivity(
          state.activityEvents,
          "system",
          "warn",
          "Preset deleted",
          name,
        ),
      };
    }),
  clearLogs: () => set((state) => ({ logs: [], healthReport: state.healthReport })),
  clearActivity: () => set((state) => ({ activityEvents: [], healthReport: state.healthReport })),

  renameProject: async (name) => {
    set({ busy: true });
    try {
      const trimmed = nonEmpty(name);
      if (!trimmed) {
        throw new Error("Project name cannot be empty");
      }
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const result = await executeCommand(projectId, {
        type: "rename_project",
        name: trimmed,
      });
      ensureOk(result, "Rename project failed");
      await runSnapshotMutation(set, get, {
        statusMessage: "Project renamed",
        log: `Project renamed to ${trimmed}`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Project renamed",
          detail: `New name: ${trimmed}`,
        },
        selectedComponentIds: get().selectedComponentIds,
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Rename project failed");
    } finally {
      set({ busy: false });
    }
  },

  bootstrap: async () => {
    set({ busy: true });
    try {
      await ensureProjectExists(set, get, ensureProjectOptions);
      const current = get().projectId;
      if (current) {
        await openProject(current, DEFAULT_BUNDLE_ROOT);
      }
      const snapshot = current ? await getProjectSnapshot(current) : null;
      set((state) => {
        if (!snapshot) {
          return {
            statusMessage: "Ready",
            project: null,
            selectedComponentId: null,
            selectedComponentIds: [],
            healthReport: null,
            ...initialAnalysisState(),
            ...staleQualityState(),
            canvasViewport: initialCanvasViewportState(),
            activityEvents: prependActivity(
              state.activityEvents,
              "system",
              "info",
              "Bootstrap",
              "No project snapshot available yet",
            ),
          };
        }
        return {
          ...applySnapshotToState(state, snapshot, "Ready"),
          selectedComponentIds: Object.keys(snapshot.model.components).slice(0, 1),
          healthReport: state.healthReport,
          activityEvents: prependActivity(
            state.activityEvents,
            "system",
            "info",
            "Bootstrap",
            `Project ready at revision ${snapshot.revision}`,
          ),
        };
      });
    } catch (error) {
      setStatusFromError(set, error, "Failed to initialize project");
    } finally {
      set({ busy: false });
    }
  },

  placeComponent: async () => {
    set({ busy: true });
    try {
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const componentId = createComponentId();

      const command: DomainCommand = {
        type: "place_component",
        component_id: componentId,
        name: `Component-${Date.now().toString().slice(-4)}`,
        position: { x: 1000, y: 1000 },
      };
      const result = await executeCommand(projectId, command);
      ensureOk(result, "Command failed");
      const snapshot = await getProjectSnapshot(projectId);
      set((state) => {
        const next = applySnapshotToState(
          {
            ...state,
            selectedComponentId: componentId,
            selectedComponentIds: [componentId],
            routeEndpoints: {
              from: state.routeEndpoints.from ?? componentId,
              to: state.routeEndpoints.to ?? componentId,
            },
          },
          snapshot,
          "Component placed",
        );
        return {
          ...next,
          ...staleQualityState(),
          selectedComponentIds: [componentId],
          healthReport: state.healthReport,
          activityEvents: prependActivity(
            state.activityEvents,
            "command",
            "ok",
            "Component placed",
            `Selected ${componentId.slice(0, 8)}`,
          ),
          logs: prependLog(state.logs, "Component placed"),
        };
      });
    } catch (error) {
      setStatusFromError(set, error, "Failed to place component");
    } finally {
      set({ busy: false });
    }
  },

  placeTemplate: async (template) => {
    set({ busy: true });
    try {
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const snapshot = await getProjectSnapshot(projectId);
      const usedNames = new Set(
        Object.values(snapshot.model.components).map((component) => component.name.trim().toLowerCase()),
      );
      const step = get().workspacePreferences.coordinateStepUm;
      const points = templatePoints(template, step);
      const baseName = templateBaseName(template);

      const commands: NonBatchDomainCommand[] = points.map((point, index) => {
        const componentId = createComponentId();
        const name = nextUniqueName(`${baseName}-${index + 1}`, usedNames);
        return {
          type: "place_component",
          component_id: componentId,
          name,
          position: {
            x: point.x,
            y: point.y,
          },
        };
      });

      const result = await executeCommand(projectId, {
        type: "batch",
        label: `template_${template}`,
        commands,
      });
      ensureOk(result, "Template placement failed");

      const after = await getProjectSnapshot(projectId);
      const lastPlacedId = Object.keys(after.model.components).at(-1) ?? null;
      set((state) => ({
        ...applySnapshotToState(
          {
            ...state,
            selectedComponentId: lastPlacedId,
            selectedComponentIds: lastPlacedId ? [lastPlacedId] : [],
          },
          after,
          `Template placed: ${template}`,
        ),
        ...staleQualityState(),
        activityEvents: prependActivity(
          state.activityEvents,
          "template",
          "ok",
          "Template placed",
          `${template} added ${commands.length} components`,
        ),
        logs: prependLog(state.logs, `Template placed (${template}, ${commands.length} components)`),
      }));
    } catch (error) {
      setStatusFromError(set, error, "Template placement failed");
    } finally {
      set({ busy: false });
    }
  },

  duplicateSelected: async () => {
    set({ busy: true });
    try {
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const before = await getProjectSnapshot(projectId);
      const selectedComponentId = get().selectedComponentId;
      if (!selectedComponentId) {
        throw new Error("No component selected");
      }
      const selected = before.model.components[selectedComponentId];
      if (!selected) {
        throw new Error("Selected component not found");
      }

      const duplicateId = createComponentId();
      const duplicateName = copyName(selected.name, before.model.components);
      const result = await executeCommand(projectId, {
        type: "batch",
        label: "duplicate_component",
        commands: [
          {
            type: "place_component",
            component_id: duplicateId,
            name: duplicateName,
            position: {
              x: selected.position.x + 200,
              y: selected.position.y + 120,
            },
          },
          {
            type: "set_component_layer",
            component_id: duplicateId,
            layer: selected.layer,
          },
        ],
      });
      ensureOk(result, "Duplicate failed");

      const snapshot = await getProjectSnapshot(projectId);
      set((state) => ({
        ...applySnapshotToState(
          {
            ...state,
            selectedComponentId: duplicateId,
            selectedComponentIds: [duplicateId],
          },
          snapshot,
          "Component duplicated",
        ),
        ...staleQualityState(),
        selectedComponentIds: [duplicateId],
        healthReport: state.healthReport,
        activityEvents: prependActivity(
          state.activityEvents,
          "command",
          "ok",
          "Component duplicated",
          `${selected.name} -> ${duplicateName}`,
        ),
        logs: prependLog(state.logs, `Duplicated ${selected.name}`),
      }));
    } catch (error) {
      setStatusFromError(set, error, "Duplicate failed");
    } finally {
      set({ busy: false });
    }
  },

  renameSelected: async (name) => {
    set({ busy: true });
    try {
      const trimmed = nonEmpty(name);
      if (!trimmed) {
        throw new Error("Component name cannot be empty");
      }
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const selectedComponentId = get().selectedComponentId;
      if (!selectedComponentId) {
        throw new Error("No component selected");
      }
      const result = await executeCommand(projectId, {
        type: "rename_component",
        component_id: selectedComponentId,
        name: trimmed,
      });
      ensureOk(result, "Rename failed");
      await runSnapshotMutation(set, get, {
        statusMessage: "Component renamed",
        log: `Component renamed to ${trimmed}`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Component renamed",
          detail: trimmed,
        },
        selectedComponentIds: [selectedComponentId],
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Rename failed");
    } finally {
      set({ busy: false });
    }
  },

  moveMany: async (entries) => {
    set({ busy: true });
    try {
      if (entries.length === 0) {
        return;
      }
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const batchCommands: NonBatchDomainCommand[] = entries
        .filter(
          (entry) =>
            entry.componentId.length > 0 && Number.isFinite(entry.x) && Number.isFinite(entry.y),
        )
        .map((entry) => ({
          type: "move_component",
          component_id: entry.componentId,
          to: { x: Math.round(entry.x), y: Math.round(entry.y) },
        }));
      if (batchCommands.length === 0) {
        throw new Error("No valid movement entries provided");
      }

      const result = await executeCommand(projectId, {
        type: "batch",
        label: "fit_all_components",
        commands: batchCommands,
      });
      ensureOk(result, "Batch move failed");
      await runSnapshotMutation(set, get, {
        statusMessage: "Canvas arrangement updated",
        log: `Moved ${batchCommands.length} components`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Batch move",
          detail: `Moved ${batchCommands.length} components`,
        },
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Batch move failed");
    } finally {
      set({ busy: false });
    }
  },

  moveComponentTo: async (componentId, x, y) => {
    set({ busy: true });
    try {
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const snapshot = get().project;
      if (!snapshot || !snapshot.model.components[componentId]) {
        throw new Error("Component not found");
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error("Coordinates must be numbers");
      }

      const step = projectStep(get());
      const snapEnabled = get().canvasViewport.snapToGrid;
      const nextX = snapEnabled ? snapCoordinate(x, step) : Math.round(x);
      const nextY = snapEnabled ? snapCoordinate(y, step) : Math.round(y);

      const result = await executeCommand(projectId, {
        type: "move_component",
        component_id: componentId,
        to: { x: nextX, y: nextY },
      });
      ensureOk(result, "Component move failed");
      await runSnapshotMutation(set, get, {
        statusMessage: "Component repositioned",
        log: `Component moved to ${nextX},${nextY}`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Component moved",
          detail: `${componentId.slice(0, 8)} -> ${nextX},${nextY}${snapEnabled ? " (snapped)" : ""}`,
        },
        selectedComponentIds: [componentId],
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Component move failed");
    } finally {
      set({ busy: false });
    }
  },

  moveSelected: async (x, y) => {
    set({ busy: true });
    try {
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const selectedComponentId = get().selectedComponentId;
      if (!selectedComponentId) {
        throw new Error("No component selected");
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error("Coordinates must be numbers");
      }
      const roundedX = Math.round(x);
      const roundedY = Math.round(y);
      const step = projectStep(get());
      const snapEnabled = get().canvasViewport.snapToGrid;
      const targetX = snapEnabled ? snapCoordinate(roundedX, step) : roundedX;
      const targetY = snapEnabled ? snapCoordinate(roundedY, step) : roundedY;
      const result = await executeCommand(projectId, {
        type: "move_component",
        component_id: selectedComponentId,
        to: { x: targetX, y: targetY },
      });
      ensureOk(result, "Move failed");
      await runSnapshotMutation(set, get, {
        statusMessage: "Component moved",
        log: `Component moved to ${targetX},${targetY}`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Selection moved",
          detail: `${targetX},${targetY}${snapEnabled ? " (snapped)" : ""}`,
        },
        selectedComponentIds: [selectedComponentId],
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Move failed");
    } finally {
      set({ busy: false });
    }
  },

  setSelectedLayer: async (layer) => {
    set({ busy: true });
    try {
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const selectedComponentId = get().selectedComponentId;
      if (!selectedComponentId) {
        throw new Error("No component selected");
      }
      const bounded = clampLayer(layer);
      const result = await executeCommand(projectId, {
        type: "set_component_layer",
        component_id: selectedComponentId,
        layer: bounded,
      });
      ensureOk(result, "Set layer failed");
      await runSnapshotMutation(set, get, {
        statusMessage: `Component moved to layer ${bounded}`,
        log: `Layer set to ${bounded}`,
        activity: {
          kind: "command",
          status: "ok",
          title: "Layer changed",
          detail: `${selectedComponentId.slice(0, 8)} -> L${bounded}`,
        },
        selectedComponentIds: [selectedComponentId],
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Set layer failed");
    } finally {
      set({ busy: false });
    }
  },

  deleteSelected: async () => {
    set({ busy: true });
    try {
      const projectId = await ensureProjectExists(set, get, ensureProjectOptions);
      const selectedComponentId = get().selectedComponentId;
      if (!selectedComponentId) {
        throw new Error("No component selected");
      }
      const result = await executeCommand(projectId, {
        type: "delete_component",
        component_id: selectedComponentId,
      });
      ensureOk(result, "Delete failed");
      await runSnapshotMutation(set, get, {
        statusMessage: "Component deleted",
        log: "Component deleted",
        activity: {
          kind: "command",
          status: "warn",
          title: "Component deleted",
          detail: selectedComponentId.slice(0, 8),
        },
        selectedComponentIds: [],
      }, ensureProjectOptions);
    } catch (error) {
      setStatusFromError(set, error, "Delete failed");
    } finally {
      set({ busy: false });
    }
  },

  undo: async () => {
    await undoAction(set, get, ensureProjectOptions);
  },

  redo: async () => {
    await redoAction(set, get, ensureProjectOptions);
  },

  save: async () => {
    await saveProjectAction(set, get, {
      ensureProjectOptions,
      bundleRoot: DEFAULT_BUNDLE_ROOT,
    });
  },

  autosave: async () => {
    await autosaveProjectAction(set, get, {
      ensureProjectOptions,
      bundleRoot: DEFAULT_BUNDLE_ROOT,
    });
  },

  runDrc: async () => {
    await runDrcAction(set, get, ensureProjectOptions);
  },

  runRoute: async () => {
    await runRouteAction(set, get, ensureProjectOptions);
  },

  runSimulation: async () => {
    await runSimulationAction(set, get, ensureProjectOptions);
  },

  runQualitySuite: async () => {
    await runQualitySuiteAction(set, get, ensureProjectOptions);
  },

  generateHealthReport: () => {
    generateHealthReportAction(set, DEFAULT_PROJECT_NAME);
  },

  replayHistoryTo: async (index) => {
    await replayHistoryToAction(set, get, index, ensureProjectOptions);
  },

  updateRules: async (rules) => {
    await updateRulesAction(set, get, rules, {
      ensureProjectOptions,
      bundleRoot: DEFAULT_BUNDLE_ROOT,
    });
  },

  exportJson: async () => {
    await exportJsonAction(set, get, {
      ensureProjectOptions,
      bundleRoot: DEFAULT_BUNDLE_ROOT,
    });
  },

  exportSvg: async () => {
    await exportSvgAction(set, get, {
      ensureProjectOptions,
      bundleRoot: DEFAULT_BUNDLE_ROOT,
    });
  },

  importJson: async () => {
    await importJsonAction(set, {
      ensureProjectOptions,
      bundleRoot: DEFAULT_BUNDLE_ROOT,
    });
  },
}));
