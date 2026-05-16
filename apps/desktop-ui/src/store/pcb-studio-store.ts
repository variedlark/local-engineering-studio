import { create } from "zustand";
import { mockPcbProject } from "../lib/mock-project";
import type {
  PcbProject,
  ToolMode,
  ViewportState,
  WorkspaceMode,
} from "../lib/pcb-types";

type PcbStudioState = {
  project: PcbProject | null;
  activeTool: ToolMode;
  activeMode: WorkspaceMode;
  selectedComponentId: string | null;
  selectedViolationId: string | null;
  viewport: ViewportState;
  logs: string[];
  openMockProject: () => void;
  createEmptyProject: () => void;
  setActiveTool: (tool: ToolMode) => void;
  setActiveMode: (mode: WorkspaceMode) => void;
  selectComponent: (componentId: string | null) => void;
  selectViolation: (violationId: string) => void;
  toggleLayer: (layerId: string) => void;
  zoomBy: (factor: number) => void;
  fitView: () => void;
  updateCursor: (x: number, y: number) => void;
  toggleSnap: () => void;
  toggleUnit: () => void;
  runDrc: () => void;
  save: () => void;
};

export const usePcbStudioStore = create<PcbStudioState>((set, get) => ({
  project: null,
  activeTool: "select",
  activeMode: "pcb",
  selectedComponentId: null,
  selectedViolationId: null,
  viewport: {
    zoom: 1,
    offset: { x: 0, y: 0 },
    cursor: { x: 0, y: 0 },
    gridMm: 1,
    snap: true,
    unit: "mm",
  },
  logs: [
    "[engine] desktop shell detected; Rust core bridge available for commands",
    "[ui] professional PCB studio shell initialized with mock design data disabled",
  ],
  openMockProject: () =>
    set({
      project: mockPcbProject,
      activeMode: "pcb",
      selectedComponentId: "u1",
      logs: [
        "[project] loaded Precision Motor Controller demo board",
        "[drc] cached report contains 1 error, 1 warning, 1 info",
      ],
    }),
  createEmptyProject: () =>
    set({
      project: {
        ...mockPcbProject,
        name: "Untitled Local PCB",
        savedState: "saved",
        board: {
          ...mockPcbProject.board,
          components: [],
          tracks: [],
          vias: [],
        },
        drc: [],
      },
      selectedComponentId: null,
      logs: [
        "[project] created empty local-first PCB project",
        "[engine] waiting for schematic or imported netlist",
      ],
    }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveMode: (mode) =>
    set((state) => ({
      activeMode: mode,
      project: state.project ? { ...state.project, mode } : state.project,
    })),
  selectComponent: (componentId) =>
    set({ selectedComponentId: componentId, selectedViolationId: null }),
  selectViolation: (violationId) => {
    const violation = get().project?.drc.find(
      (item) => item.id === violationId,
    );
    set((state) => ({
      selectedViolationId: violationId,
      selectedComponentId:
        violation?.objectIds.find((id) =>
          state.project?.board.components.some(
            (component) => component.id === id,
          ),
        ) ?? state.selectedComponentId,
      viewport: violation
        ? { ...state.viewport, cursor: violation.location }
        : state.viewport,
    }));
  },
  toggleLayer: (layerId) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            board: {
              ...state.project.board,
              layers: state.project.board.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, visible: !layer.visible }
                  : layer,
              ),
            },
          }
        : state.project,
    })),
  zoomBy: (factor) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.min(2.4, Math.max(0.45, state.viewport.zoom * factor)),
      },
    })),
  fitView: () =>
    set((state) => ({
      viewport: { ...state.viewport, zoom: 1, offset: { x: 0, y: 0 } },
    })),
  updateCursor: (x, y) =>
    set((state) => ({ viewport: { ...state.viewport, cursor: { x, y } } })),
  toggleSnap: () =>
    set((state) => ({
      viewport: { ...state.viewport, snap: !state.viewport.snap },
    })),
  toggleUnit: () =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        unit: state.viewport.unit === "mm" ? "mil" : "mm",
      },
    })),
  runDrc: () =>
    set((state) => ({
      logs: [
        `[drc] report refreshed: ${state.project?.drc.length ?? 0} findings`,
        ...state.logs,
      ],
    })),
  save: () =>
    set((state) => ({
      project: state.project
        ? { ...state.project, savedState: "saved" }
        : state.project,
      logs: ["[project] saved local workspace snapshot", ...state.logs],
    })),
}));
