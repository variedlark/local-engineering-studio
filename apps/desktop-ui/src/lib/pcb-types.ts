export type UnitSystem = "mm" | "mil";

export type ToolMode =
  | "select"
  | "move"
  | "route"
  | "via"
  | "track"
  | "copper-zone"
  | "measure"
  | "add-component"
  | "inspect"
  | "comment";

export type WorkspaceMode =
  | "schematic"
  | "pcb"
  | "3d"
  | "simulation"
  | "manufacturing";

export type Point = { x: number; y: number };

export type LayerKind = "signal" | "plane" | "mask" | "silk" | "mechanical";

export type Layer = {
  id: string;
  name: string;
  kind: LayerKind;
  side: "top" | "bottom" | "internal" | "mechanical";
  color: string;
  visible: boolean;
  order: number;
};

export type Net = {
  id: string;
  name: string;
  voltage?: string;
  impedanceOhms?: number;
  differentialPair?: string;
  unroutedLengthMm: number;
};

export type Pad = {
  id: string;
  netId: string;
  position: Point;
  width: number;
  height: number;
  shape: "rect" | "round" | "oval";
};

export type Footprint = {
  id: string;
  name: string;
  package: string;
  pads: Pad[];
};

export type Component = {
  id: string;
  reference: string;
  value: string;
  footprint: Footprint;
  position: Point;
  rotation: number;
  layerId: string;
  selected?: boolean;
};

export type Track = {
  id: string;
  netId: string;
  layerId: string;
  width: number;
  points: Point[];
  lengthMm: number;
};

export type Via = {
  id: string;
  netId: string;
  position: Point;
  drill: number;
  diameter: number;
  fromLayerId: string;
  toLayerId: string;
};

export type Board = {
  id: string;
  name: string;
  width: number;
  height: number;
  outline: Point[];
  layers: Layer[];
  components: Component[];
  tracks: Track[];
  vias: Via[];
};

export type DrcSeverity = "error" | "warning" | "info";

export type DrcViolation = {
  id: string;
  severity: DrcSeverity;
  title: string;
  rule: string;
  description: string;
  suggestion: string;
  location: Point;
  objectIds: string[];
};

export type ManufacturingExport = {
  id: string;
  name: string;
  format: "gerber" | "drill" | "bom" | "pick-place" | "step";
  status: "ready" | "needs-check" | "coming-soon";
  detail: string;
};

export type PcbProject = {
  id: string;
  name: string;
  path: string;
  revision: string;
  savedState: "saved" | "dirty" | "saving";
  engineStatus: "offline" | "ready" | "busy";
  mode: WorkspaceMode;
  board: Board;
  nets: Net[];
  drc: DrcViolation[];
  manufacturing: ManufacturingExport[];
};

export type ViewportState = {
  zoom: number;
  offset: Point;
  cursor: Point;
  gridMm: number;
  snap: boolean;
  unit: UnitSystem;
};
