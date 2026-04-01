import type { ComponentTemplatePreset } from "./ui-store.types";

export type InspectorComponent = {
  id: string;
  name: string;
  x: number;
  y: number;
  layer: number;
};

export type MovementEntry = {
  componentId: string;
  x: number;
  y: number;
};

export type QuickActionDefinition = {
  id: string;
  label: string;
  hint: string;
  disabled?: boolean;
  onRun: () => void;
};

export function buildFitAllEntries(components: InspectorComponent[], step: number): MovementEntry[] {
  if (components.length === 0) {
    return [];
  }

  const cols = Math.max(1, Math.ceil(Math.sqrt(components.length)));
  return components.map((component, index) => ({
    componentId: component.id,
    x: (index % cols) * step,
    y: Math.floor(index / cols) * step,
  }));
}

export function buildNudgeEntries(
  selectedIds: string[],
  components: InspectorComponent[],
  dx: number,
  dy: number,
): MovementEntry[] {
  if (selectedIds.length === 0) {
    return [];
  }
  const selectedSet = new Set(selectedIds);
  return components
    .filter((component) => selectedSet.has(component.id))
    .map((component) => ({
      componentId: component.id,
      x: component.x + dx,
      y: component.y + dy,
    }));
}

export function suggestedTemplate(componentCount: number): ComponentTemplatePreset {
  if (componentCount === 0) {
    return "grid_3x3";
  }
  if (componentCount < 5) {
    return "line_5";
  }
  return "ring_8";
}

export function createQuickActionDefinitions(args: {
  selectedCount: number;
  hasProject: boolean;
  onPlaceComponent: () => void;
  onPlaceTemplate: (template: ComponentTemplatePreset) => void;
  template: ComponentTemplatePreset;
  onDuplicate: () => void;
  onQualitySuite: () => void;
  onDrc: () => void;
  onRoute: () => void;
  onSimulation: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onAutosave: () => void;
  onAlignCenterX: () => void;
  onDistributeHorizontal: () => void;
  onToggleSnap: () => void;
  onResetViewport: () => void;
  onOpenPalette: () => void;
}): QuickActionDefinition[] {
  return [
    {
      id: "place",
      label: "Place Component",
      hint: "Insert a new component at default position",
      disabled: !args.hasProject,
      onRun: args.onPlaceComponent,
    },
    {
      id: "template",
      label: "Place Template",
      hint: `Insert ${args.template.replace("_", " ")}`,
      disabled: !args.hasProject,
      onRun: () => args.onPlaceTemplate(args.template),
    },
    {
      id: "duplicate",
      label: "Duplicate",
      hint: "Clone current selection",
      disabled: args.selectedCount === 0,
      onRun: args.onDuplicate,
    },
    {
      id: "quality",
      label: "Run Quality",
      hint: "Execute DRC + route + simulation score",
      onRun: args.onQualitySuite,
    },
    {
      id: "drc",
      label: "Run DRC",
      hint: "Spacing validation",
      onRun: args.onDrc,
    },
    {
      id: "route",
      label: "Run Route",
      hint: "Route between selected endpoints",
      onRun: args.onRoute,
    },
    {
      id: "simulation",
      label: "Run Simulation",
      hint: "Evaluate dynamic stability",
      onRun: args.onSimulation,
    },
    {
      id: "align-center",
      label: "Align Center X",
      hint: "Align selected components on vertical axis",
      disabled: args.selectedCount < 2,
      onRun: args.onAlignCenterX,
    },
    {
      id: "distribute-h",
      label: "Distribute H",
      hint: "Spread selected components evenly",
      disabled: args.selectedCount < 3,
      onRun: args.onDistributeHorizontal,
    },
    {
      id: "snap",
      label: "Toggle Snap",
      hint: "Enable or disable snap-to-grid",
      onRun: args.onToggleSnap,
    },
    {
      id: "reset-view",
      label: "Reset View",
      hint: "Reset pan and zoom",
      onRun: args.onResetViewport,
    },
    {
      id: "autosave",
      label: "Autosave",
      hint: "Persist current snapshot",
      onRun: args.onAutosave,
    },
    {
      id: "save",
      label: "Save",
      hint: "Write project bundle",
      onRun: args.onSave,
    },
    {
      id: "undo",
      label: "Undo",
      hint: "Revert last command",
      onRun: args.onUndo,
    },
    {
      id: "redo",
      label: "Redo",
      hint: "Re-apply reverted command",
      onRun: args.onRedo,
    },
    {
      id: "palette",
      label: "Command Palette",
      hint: "Open full searchable command list",
      onRun: args.onOpenPalette,
    },
  ];
}
