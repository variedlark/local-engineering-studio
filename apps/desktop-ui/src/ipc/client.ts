import {
  commandResponseSchema,
  createProjectResponseSchema,
  drcReportSchema,
  listOpenProjectsResponseSchema,
  projectSnapshotSchema,
  routeReportSchema,
  simulationReportSchema,
  undoRedoResponseSchema,
  type DomainCommand,
} from "@ipc/index";

type TauriInvoke = <T>(command: string, payload?: Record<string, unknown>) => Promise<T>;

type SaveResponse = {
  project_id: string;
  bundle_path: string;
};

type ImportExportStats = {
  components: number;
  nets: number;
};

type DrcReport = {
  violations: Array<{ kind: string; message: string; component_ids: string[] }>;
  checked_pairs: number;
};

type RouteReport = {
  success: boolean;
  path: Array<{ x: number; y: number }>;
  expanded_nodes: number;
};

type SimulationReport = {
  points: Array<{ t: number; value: number }>;
  stable: boolean;
  summary: string;
};

type MaybeTauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
};

const inTauri =
  typeof window !== "undefined" &&
  Boolean((window as MaybeTauriWindow).__TAURI_INTERNALS__);

async function loadInvoke(): Promise<TauriInvoke | null> {
  if (!inTauri) {
    return null;
  }

  const api = await import("@tauri-apps/api/core");
  return api.invoke as TauriInvoke;
}

const DEV_PROJECT_ID = "11111111-1111-7111-8111-111111111111";

let devState = {
  projectId: DEV_PROJECT_ID,
  name: "Untitled Project",
  revision: 0,
  dirty: false,
  canUndo: false,
  canRedo: false,
  lastAutosaveMs: null as number | null,
};

function mockSnapshot() {
  return projectSnapshotSchema.parse({
    project_id: devState.projectId,
    name: devState.name,
    revision: devState.revision,
    dirty: devState.dirty,
    can_undo: devState.canUndo,
    can_redo: devState.canRedo,
    last_autosave_ms: devState.lastAutosaveMs,
    model: {
      meta: {
        project_id: devState.projectId,
        name: devState.name,
        format_major: 1,
        format_minor: 0,
        created_at_ms: Date.now() - 1000,
        updated_at_ms: Date.now(),
        revision: devState.revision,
      },
      components: {},
      nets: {},
      rules: {
        min_spacing_um: 100,
        grid_step_um: 50,
      },
    },
  });
}

function mockCommandResult() {
  devState = {
    ...devState,
    revision: devState.revision + 1,
    dirty: true,
    canUndo: true,
  };
  return commandResponseSchema.parse({
    ok: true,
    error_code: null,
    message: null,
    revision: devState.revision,
  });
}

export async function createProject(name: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    devState = { ...devState, name };
    return createProjectResponseSchema.parse({ project_id: DEV_PROJECT_ID });
  }

  const raw = await invoke("create_project", { request: { name } });
  return createProjectResponseSchema.parse(raw);
}

export async function listOpenProjects() {
  const invoke = await loadInvoke();
  if (!invoke) {
    return listOpenProjectsResponseSchema.parse({ projects: [mockSnapshot()] });
  }

  const raw = await invoke("list_open_projects");
  return listOpenProjectsResponseSchema.parse(raw);
}

export async function getProjectSnapshot(projectId: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    devState = { ...devState, projectId };
    return mockSnapshot();
  }

  const raw = await invoke("project_snapshot", { projectId });
  return projectSnapshotSchema.parse(raw);
}

export async function executeCommand(projectId: string, command: DomainCommand) {
  const invoke = await loadInvoke();
  if (!invoke) {
    void projectId;
    if (command.type === "rename_component") {
      if (!command.name.trim()) {
        return commandResponseSchema.parse({
          ok: false,
          error_code: "Validation",
          message: "Component name cannot be empty",
          revision: devState.revision,
        });
      }
    }
    if (command.type === "rename_project") {
      if (!command.name.trim()) {
        return commandResponseSchema.parse({
          ok: false,
          error_code: "Validation",
          message: "Project name cannot be empty",
          revision: devState.revision,
        });
      }
      devState = {
        ...devState,
        name: command.name,
      };
    }
    if (command.type === "set_rules") {
      const spacing = Math.max(1, Math.round(command.min_spacing_um));
      const grid = Math.max(1, Math.round(command.grid_step_um));
      if (spacing % grid !== 0) {
        return commandResponseSchema.parse({
          ok: false,
          error_code: "Validation",
          message: "Minimum spacing must be an integer multiple of grid step",
          revision: devState.revision,
        });
      }
    }
    return mockCommandResult();
  }

  const raw = await invoke("execute_command", {
    request: {
      project_id: projectId,
      command,
    },
  });
  return commandResponseSchema.parse(raw);
}

export async function undo(projectId: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    if (!devState.canUndo) {
      return undoRedoResponseSchema.parse({
        ok: true,
        changed: false,
        error_code: null,
        message: null,
        revision: devState.revision,
      });
    }
    devState = {
      ...devState,
      revision: Math.max(0, devState.revision - 1),
      canRedo: true,
      canUndo: devState.revision > 1,
    };
    return undoRedoResponseSchema.parse({
      ok: true,
      changed: true,
      error_code: null,
      message: null,
      revision: devState.revision,
    });
  }

  const raw = await invoke("undo", { request: { project_id: projectId } });
  return undoRedoResponseSchema.parse(raw);
}

export async function redo(projectId: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    if (!devState.canRedo) {
      return undoRedoResponseSchema.parse({
        ok: true,
        changed: false,
        error_code: null,
        message: null,
        revision: devState.revision,
      });
    }
    devState = {
      ...devState,
      revision: devState.revision + 1,
      canUndo: true,
      canRedo: false,
    };
    return undoRedoResponseSchema.parse({
      ok: true,
      changed: true,
      error_code: null,
      message: null,
      revision: devState.revision,
    });
  }

  const raw = await invoke("redo", { request: { project_id: projectId } });
  return undoRedoResponseSchema.parse(raw);
}

export async function saveProject(projectId: string, bundleRoot: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    devState = { ...devState, dirty: false };
    return { project_id: projectId, bundle_path: `${bundleRoot}/${projectId}` };
  }

  return invoke<SaveResponse>("save_project", {
    request: {
      project_id: projectId,
      bundle_root: bundleRoot,
    },
  });
}

export async function autosaveProject(projectId: string, bundleRoot: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    devState = { ...devState, dirty: false, lastAutosaveMs: Date.now() };
    return { project_id: projectId, bundle_path: `${bundleRoot}/${projectId}` };
  }

  return invoke<SaveResponse>("autosave_project", {
    request: {
      project_id: projectId,
      bundle_root: bundleRoot,
    },
  });
}

export async function analyzeDrc(projectId: string): Promise<DrcReport> {
  const invoke = await loadInvoke();
  if (!invoke) {
    return { violations: [], checked_pairs: 0 };
  }

  const raw = await invoke<DrcReport>("run_drc", {
    request: { project_id: projectId },
  });
  return drcReportSchema.parse(raw);
}

export async function analyzeRoute(
  projectId: string,
  fromComponentId: string,
  toComponentId: string,
): Promise<RouteReport> {
  const invoke = await loadInvoke();
  if (!invoke) {
    return { success: true, path: [], expanded_nodes: 0 };
  }

  const raw = await invoke<RouteReport>("run_route", {
    request: {
      project_id: projectId,
      from_component_id: fromComponentId,
      to_component_id: toComponentId,
    },
  });
  return routeReportSchema.parse(raw);
}

export async function analyzeSimulation(
  projectId: string,
  config: { time_step: number; steps: number; initial_energy: number },
): Promise<SimulationReport> {
  const invoke = await loadInvoke();
  if (!invoke) {
    return {
      points: [],
      stable: true,
      summary: "Simulation skipped in browser preview mode",
    };
  }

  const raw = await invoke<SimulationReport>("run_simulation", {
    request: {
      project_id: projectId,
      config,
    },
  });
  return simulationReportSchema.parse(raw);
}

export async function exportProject(
  projectId: string,
  outputFile: string,
  format: "json" | "svg",
): Promise<ImportExportStats> {
  const invoke = await loadInvoke();
  if (!invoke) {
    return { components: 0, nets: 0 };
  }

  const raw = await invoke<ImportExportStats>("export_project", {
    request: {
      project_id: projectId,
      output_file: outputFile,
      format,
    },
  });
  return raw;
}

export async function importProject(inputFile: string, nameOverride?: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    return createProjectResponseSchema.parse({ project_id: DEV_PROJECT_ID });
  }

  const raw = await invoke("import_project", {
    request: {
      input_file: inputFile,
      name_override: nameOverride ?? null,
    },
  });
  return createProjectResponseSchema.parse(raw);
}

export async function openProject(projectId: string, bundleRoot: string) {
  const invoke = await loadInvoke();
  if (!invoke) {
    return createProjectResponseSchema.parse({ project_id: projectId });
  }
  const raw = await invoke("open_project", {
    request: {
      project_id: projectId,
      bundle_root: bundleRoot,
    },
  });
  return createProjectResponseSchema.parse(raw);
}
