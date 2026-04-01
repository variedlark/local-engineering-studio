import type { DrcReport, ProjectSnapshot, RouteReport, SimulationReport } from "@ipc/index";

export type CommandResult = {
  ok: boolean;
  errorCode?: string | null;
  message?: string | null;
  revision?: number | null;
};

export type UndoRedoResult = {
  ok: boolean;
  changed: boolean;
  errorCode?: string | null;
  message?: string | null;
  revision?: number | null;
};

export type AppProject = ProjectSnapshot;
export type AppDrcReport = DrcReport;
export type AppRouteReport = RouteReport;
export type AppSimulationReport = SimulationReport;
