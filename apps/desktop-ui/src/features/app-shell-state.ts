import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useUiStore } from "./ui-store";
import { WORKFLOW_HIGHLIGHTS } from "./workflow-highlights";

export function useAppShellStore() {
  return useUiStore(
    useShallow((state) => ({
      paletteOpen: state.paletteOpen,
      setPaletteOpen: state.setPaletteOpen,
      togglePalette: state.togglePalette,
      bootstrap: state.bootstrap,
      placeComponent: state.placeComponent,
      duplicateSelected: state.duplicateSelected,
      renameSelected: state.renameSelected,
      moveMany: state.moveMany,
      moveComponentTo: state.moveComponentTo,
      alignSelection: state.alignSelection,
      distributeSelection: state.distributeSelection,
      moveSelected: state.moveSelected,
      setSelectedLayer: state.setSelectedLayer,
      deleteSelected: state.deleteSelected,
      selectedComponentId: state.selectedComponentId,
      selectedComponentIds: state.selectedComponentIds,
      selectComponent: state.selectComponent,
      selectComponents: state.selectComponents,
      toggleComponentSelection: state.toggleComponentSelection,
      clearSelection: state.clearSelection,
      setRouteEndpoints: state.setRouteEndpoints,
      routeEndpoints: state.routeEndpoints,
      routePath: state.routePath,
      simulationConfig: state.simulationConfig,
      setSimulationConfig: state.setSimulationConfig,
      canvasViewport: state.canvasViewport,
      setCanvasViewport: state.setCanvasViewport,
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
      setCanvasOffset: state.setCanvasOffset,
      panCanvasBy: state.panCanvasBy,
      zoomCanvasBy: state.zoomCanvasBy,
      resetCanvasViewport: state.resetCanvasViewport,
      toggleCanvasGrid: state.toggleCanvasGrid,
      toggleCanvasSnap: state.toggleCanvasSnap,
      rules: state.rules,
      updateRules: state.updateRules,
      clearLogs: state.clearLogs,
      clearActivity: state.clearActivity,
      replayHistoryTo: state.replayHistoryTo,
      renameProject: state.renameProject,
      undo: state.undo,
      redo: state.redo,
      save: state.save,
      autosave: state.autosave,
      runDrc: state.runDrc,
      runRoute: state.runRoute,
      runSimulation: state.runSimulation,
      runQualitySuite: state.runQualitySuite,
      placeTemplate: state.placeTemplate,
      exportJson: state.exportJson,
      exportSvg: state.exportSvg,
      importJson: state.importJson,
      project: state.project,
      statusMessage: state.statusMessage,
      busy: state.busy,
      drcViolations: state.drcViolations,
      routeStatus: state.routeStatus,
      simulationSummary: state.simulationSummary,
      qualityScore: state.qualityScore,
      qualitySummary: state.qualitySummary,
      workspacePreferences: state.workspacePreferences,
      updateWorkspacePreferences: state.updateWorkspacePreferences,
      workspacePresets: state.workspacePresets,
      saveWorkspacePreset: state.saveWorkspacePreset,
      applyWorkspacePreset: state.applyWorkspacePreset,
      deleteWorkspacePreset: state.deleteWorkspacePreset,
      generateHealthReport: state.generateHealthReport,
      healthReport: state.healthReport,
      logs: state.logs,
      activityEvents: state.activityEvents,
    })),
  );
}

export function useProjectDerived(project: ReturnType<typeof useAppShellStore>["project"], selectedComponentId: string | null) {
  const componentCount = useMemo(() => Object.keys(project?.model.components ?? {}).length, [project]);
  const netCount = useMemo(() => Object.keys(project?.model.nets ?? {}).length, [project]);

  const inspectorComponents = useMemo(
    () =>
      Object.values(project?.model.components ?? {}).map((component) => ({
        id: component.id,
        name: component.name,
        x: component.position.x,
        y: component.position.y,
        layer: component.layer,
      })),
    [project],
  );

  const firstComponent = useMemo(() => {
    const entries = Object.entries(project?.model.components ?? {});
    if (entries.length === 0) {
      return null;
    }
    if (!selectedComponentId) {
      return entries[0][1];
    }
    return (project?.model.components[selectedComponentId] ?? entries[0][1]) as
      | (typeof entries)[number][1]
      | null;
  }, [project, selectedComponentId]);

  const routeOptions = useMemo(
    () => inspectorComponents.map((component) => ({ id: component.id, name: component.name })),
    [inspectorComponents],
  );

  const workflowHighlights = useMemo(() => WORKFLOW_HIGHLIGHTS.slice(0, 3), []);

  return {
    componentCount,
    netCount,
    inspectorComponents,
    firstComponent,
    routeOptions,
    workflowHighlights,
  };
}
