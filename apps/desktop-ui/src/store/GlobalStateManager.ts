import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface EditorState {
  selectedComponentId: string | null;
  selectedNetId: string | null;
  zoomLevel: number;
  panX: number;
  panY: number;
  gridVisible: boolean;
  gridSize: number;
  showDRC: boolean;
  showSimulation: boolean;
  showThermal: boolean;
  currentLayer: number;
  maxLayers: number;
}

export interface ProjectState {
  projectId: string;
  projectName: string;
  isDirty: boolean;
  lastSavedTime: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
}

export interface UIState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  outputConsoleOpen: boolean;
  theme: 'dark' | 'light';
  showPerformanceMetrics: boolean;
}

interface GlobalState {
  editor: EditorState;
  project: ProjectState;
  ui: UIState;
  updateEditor: (partial: Partial<EditorState>) => void;
  updateProject: (partial: Partial<ProjectState>) => void;
  updateUI: (partial: Partial<UIState>) => void;
  resetEditor: () => void;
  resetProject: () => void;
  resetUI: () => void;
}

const defaultEditorState: EditorState = {
  selectedComponentId: null,
  selectedNetId: null,
  zoomLevel: 1,
  panX: 0,
  panY: 0,
  gridVisible: true,
  gridSize: 10,
  showDRC: true,
  showSimulation: false,
  showThermal: false,
  currentLayer: 0,
  maxLayers: 4,
};

const defaultProjectState: ProjectState = {
  projectId: '',
  projectName: 'Untitled Project',
  isDirty: false,
  lastSavedTime: Date.now(),
  autoSaveEnabled: true,
  autoSaveInterval: 30000,
};

const defaultUIState: UIState = {
  sidebarOpen: true,
  propertiesPanelOpen: true,
  outputConsoleOpen: false,
  theme: 'dark',
  showPerformanceMetrics: false,
};

export const useGlobalState = create<GlobalState>()(
  devtools(
    persist(
      (set) => ({
        editor: defaultEditorState,
        project: defaultProjectState,
        ui: defaultUIState,

        updateEditor: (partial) =>
          set((state) => ({
            editor: { ...state.editor, ...partial },
          })),

        updateProject: (partial) =>
          set((state) => ({
            project: { ...state.project, ...partial, isDirty: true },
          })),

        updateUI: (partial) =>
          set((state) => ({
            ui: { ...state.ui, ...partial },
          })),

        resetEditor: () =>
          set(() => ({
            editor: defaultEditorState,
          })),

        resetProject: () =>
          set(() => ({
            project: defaultProjectState,
          })),

        resetUI: () =>
          set(() => ({
            ui: defaultUIState,
          })),
      }),
      {
        name: 'les-global-state',
        partialize: (state) => ({
          ui: state.ui,
          editor: {
            gridVisible: state.editor.gridVisible,
            gridSize: state.editor.gridSize,
            zoomLevel: state.editor.zoomLevel,
          },
        }),
      }
    )
  )
);
