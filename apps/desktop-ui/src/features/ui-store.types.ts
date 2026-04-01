export const DEFAULT_PROJECT_NAME = "Untitled Project";

export type ComponentTemplatePreset = "line_5" | "ring_8" | "grid_3x3";

export type WorkspacePreferences = {
  autosaveIntervalSec: number;
  coordinateStepUm: number;
  showStatusHints: boolean;
  accent: "sky" | "emerald" | "amber";
  density: "comfortable" | "compact";
};

export type ActivityKind = "command" | "analysis" | "system" | "quality" | "template";

export type ActivityStatus = "ok" | "warn" | "error" | "info";

export type ActivityEvent = {
  id: string;
  at: number;
  kind: ActivityKind;
  status: ActivityStatus;
  title: string;
  detail: string;
};

export type CanvasViewportState = {
  offsetX: number;
  offsetY: number;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
};

export type SelectionAlignMode =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "center_x"
  | "center_y";

export type SelectionDistributeAxis = "horizontal" | "vertical";

export type WorkspacePreset = {
  name: string;
  preferences: WorkspacePreferences;
  viewport: CanvasViewportState;
};

export type HealthReport = {
  generatedAt: number;
  summary: string;
  details: string[];
};
