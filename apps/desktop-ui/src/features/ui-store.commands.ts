import type { NonBatchDomainCommand } from "@ipc/index";
import type { AppProject } from "../domain/types";
import { DEFAULT_WORKSPACE_PREFERENCES } from "./ui-store.storage";
import type { ComponentTemplatePreset, WorkspacePreferences } from "./ui-store.types";

type ComponentMap = NonNullable<AppProject>["model"]["components"];

export function nonEmpty(value: string) {
  return value.trim();
}

export function clampLayer(layer: number) {
  if (!Number.isFinite(layer)) {
    return 0;
  }
  const rounded = Math.round(layer);
  if (rounded < -32) {
    return -32;
  }
  if (rounded > 32) {
    return 32;
  }
  return rounded;
}

export function createComponentId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function copyName(base: string, components: ComponentMap) {
  const existing = new Set(
    Object.values(components).map((component) => component.name.trim().toLowerCase()),
  );
  let index = 1;
  let candidate = `${base}-copy`;
  while (existing.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${base}-copy-${index}`;
  }
  return candidate;
}

export function nextUniqueName(base: string, usedNames: Set<string>) {
  let candidate = base;
  let index = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

export function templatePoints(template: ComponentTemplatePreset, step: number) {
  if (template === "line_5") {
    return Array.from({ length: 5 }, (_, index) => ({
      x: index * step,
      y: 0,
    }));
  }

  if (template === "ring_8") {
    return Array.from({ length: 8 }, (_, index) => {
      const radians = (Math.PI * 2 * index) / 8;
      return {
        x: Math.round(Math.cos(radians) * step * 1.6),
        y: Math.round(Math.sin(radians) * step * 1.6),
      };
    });
  }

  return Array.from({ length: 9 }, (_, index) => ({
    x: (index % 3) * step,
    y: Math.floor(index / 3) * step,
  }));
}

export function templateBaseName(template: ComponentTemplatePreset) {
  if (template === "line_5") {
    return "LineNode";
  }
  if (template === "ring_8") {
    return "RingNode";
  }
  return "GridNode";
}

export function projectStep(state: { workspacePreferences: WorkspacePreferences }) {
  const configured = Number.isFinite(state.workspacePreferences.coordinateStepUm)
    ? Math.round(state.workspacePreferences.coordinateStepUm)
    : DEFAULT_WORKSPACE_PREFERENCES.coordinateStepUm;
  return Math.max(10, configured);
}

export function snapCoordinate(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function collectSelectedComponents(state: {
  project: AppProject | null;
  selectedComponentIds: string[];
}) {
  const project = state.project;
  if (!project) {
    return [] as Array<{ id: string; name: string; position: { x: number; y: number }; layer: number }>;
  }
  return state.selectedComponentIds
    .map((id) => project.model.components[id])
    .filter((component): component is NonNullable<typeof component> => Boolean(component));
}

export function createBatchMoveCommands(entries: Array<{ componentId: string; x: number; y: number }>) {
  const commands: NonBatchDomainCommand[] = entries.map((entry) => ({
    type: "move_component",
    component_id: entry.componentId,
    to: { x: Math.round(entry.x), y: Math.round(entry.y) },
  }));
  return commands;
}

export function batchMoveSelection(
  state: { selectedComponentIds: string[] },
  entries: Array<{ componentId: string; x: number; y: number }>,
  label: string,
) {
  const selectedSet = new Set(state.selectedComponentIds);
  if (entries.length === 0) {
    throw new Error("No movement entries provided");
  }
  if (entries.length === 1) {
    const entry = entries[0];
    return {
      commands: createBatchMoveCommands(entries),
      selectedIds: selectedSet.has(entry.componentId) ? [entry.componentId] : state.selectedComponentIds,
      label,
    };
  }
  return {
    commands: createBatchMoveCommands(entries),
    selectedIds: state.selectedComponentIds,
    label,
  };
}

export function ensureOk(result: { ok: boolean; message?: string | null }, fallbackMessage: string) {
  if (!result.ok) {
    throw new Error(result.message ?? fallbackMessage);
  }
}
