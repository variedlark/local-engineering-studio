import { useEffect, useMemo, useState } from "react";
import { Box, Activity, History } from "lucide-react";
import { CanvasViewport } from "../canvas/CanvasViewport";
import { Canvas3D } from "../canvas/Canvas3D";
import { CommandPalette } from "../features/command-palette";
import { DEFAULT_PROJECT_NAME } from "../features/ui-store.types";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import { useAppShellStore, useProjectDerived } from "../features/app-shell-state";
import { AnalysisHud } from "./components/AnalysisHud";
import { EmptyState } from "./components/EmptyState";
import { HudDock } from "./components/HudDock";
import { HudPanel } from "./components/HudPanel";
import { HudPortal } from "./components/HudPortal";
import { InspectorHud } from "./components/InspectorHud";
import { ProjectHud } from "./components/ProjectHud";
import { HistoryHud } from "./components/HistoryHud";
import { ZenStatusBar } from "./components/ZenStatusBar";

type HudState = {
  project: boolean;
  analysis: boolean;
  history: boolean;
};

export function ImmersiveShell() {
  const isTest = import.meta.env.MODE === "test";
  const store = useAppShellStore();
  const {
    bootstrap,
    workspacePreferences,
    autosave,
    selectedComponentId,
    selectedComponentIds,
    selectComponents,
  } = store;

  const {
    componentCount,
    netCount,
    inspectorComponents,
    firstComponent,
  } = useProjectDerived(store.project, store.selectedComponentId);

  const [hudState, setHudState] = useState<HudState>({
    project: true,
    analysis: false,
    history: false,
  });

  const hasProject = store.project !== null;
  const projectName = store.project?.name ?? DEFAULT_PROJECT_NAME;

  const toggleHud = (key: keyof HudState) => {
    setHudState((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  useEffect(() => {
    if (isTest) {
      return;
    }
    void bootstrap();
  }, [bootstrap, isTest]);

  useEffect(() => {
    if (isTest) {
      return;
    }
    if (typeof document !== "undefined") {
      document.documentElement.dataset.accent = workspacePreferences.accent;
      document.documentElement.dataset.density = workspacePreferences.density;
    }
  }, [isTest, workspacePreferences.accent, workspacePreferences.density]);

  useEffect(() => {
    if (isTest) {
      return;
    }
    const timer = window.setInterval(() => {
      void autosave();
    }, workspacePreferences.autosaveIntervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [autosave, isTest, workspacePreferences.autosaveIntervalSec]);

  useEffect(() => {
    if (selectedComponentId && !selectedComponentIds.includes(selectedComponentId)) {
      selectComponents([selectedComponentId, ...selectedComponentIds]);
    }
  }, [selectComponents, selectedComponentId, selectedComponentIds]);

  const components3d = useMemo(
    () =>
      inspectorComponents.map((component) => ({
        id: component.id,
        name: component.name,
        x: component.x,
        y: component.y,
        z: component.layer * 6,
        width: 14,
        height: 6,
        depth: 8,
        layer: component.layer,
        color: component.layer < 0 ? "#ff4fd8" : "#2ee8ff",
      })),
    [inspectorComponents],
  );

  useKeyboardShortcuts({
    onCommandPalette: store.togglePalette,
    onAutosave: () => void store.autosave(),
    onDuplicate: () => void store.duplicateSelected(),
    onUndo: () => void store.undo(),
    onRedo: () => void store.redo(),
    onRunRoute: () => void store.runRoute(),
    onSave: () => void store.save(),
    onRunDrc: () => void store.runDrc(),
    onRunSimulation: () => void store.runSimulation(),
    onRunQualitySuite: () => void store.runQualitySuite(),
    onPanLeft: () => store.panCanvasBy(-80, 0),
    onPanRight: () => store.panCanvasBy(80, 0),
    onPanUp: () => store.panCanvasBy(0, -80),
    onPanDown: () => store.panCanvasBy(0, 80),
    onZoomIn: () => store.zoomCanvasBy(1.1),
    onZoomOut: () => store.zoomCanvasBy(0.9),
    onResetViewport: () => store.resetCanvasViewport(),
    onToggleSnap: () => store.toggleCanvasSnap(),
    onClearSelection: () => store.clearSelection(),
  });

  const recentProjects = [
    { name: "Power Rail Prototype", detail: "2 days ago" },
    { name: "Quantum Sensor Board", detail: "1 week ago" },
  ];

  const templates = [
    { id: "grid_3x3" as const, name: "Grid 3x3", detail: "9 components" },
    { id: "line_5" as const, name: "Line 5", detail: "5 components" },
    { id: "ring_8" as const, name: "Ring 8", detail: "8 components" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--les-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(46,232,255,0.08),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,79,216,0.08),transparent_40%)]" />
      <div className="absolute inset-0">
        {store.viewMode === "3d" ? (
          <Canvas3D
            components={components3d}
            selectedComponentIds={store.selectedComponentIds}
            onSelectComponent={(componentId) => store.selectComponent(componentId)}
            onDeselectAll={store.clearSelection}
          />
        ) : (
          <CanvasViewport
            components={inspectorComponents}
            onMoveComponent={(componentId, x, y) => void store.moveComponentTo(componentId, x, y)}
            onSelectComponent={(componentId) => store.selectComponent(componentId)}
            onToggleComponentSelection={(componentId) => store.toggleComponentSelection(componentId)}
            onZoomBy={store.zoomCanvasBy}
            routePath={store.routePath}
            selectedComponentIds={store.selectedComponentIds}
            viewport={store.canvasViewport}
          />
        )}
      </div>

      {!hasProject ? (
        <EmptyState templates={templates} recentProjects={recentProjects} onSelectTemplate={store.placeTemplate} />
      ) : null}

      <HudPortal>
        <HudDock
          onCommand={store.togglePalette}
          items={[
            {
              id: "project",
              label: "Project HUD",
              icon: <Box className="h-4 w-4" />,
              active: hudState.project,
              onClick: () => toggleHud("project"),
            },
            {
              id: "analysis",
              label: "Analysis HUD",
              icon: <Activity className="h-4 w-4" />,
              active: hudState.analysis,
              onClick: () => toggleHud("analysis"),
            },
            {
              id: "history",
              label: "History HUD",
              icon: <History className="h-4 w-4" />,
              active: hudState.history,
              onClick: () => toggleHud("history"),
            },
          ]}
        />

        <HudPanel open={hudState.project} title="Project" onClose={() => toggleHud("project")}>
          <ProjectHud
            projectName={projectName}
            revision={store.project?.revision ?? 0}
            componentCount={componentCount}
            netCount={netCount}
            selectedCount={store.selectedComponentIds.length}
            components={inspectorComponents.map((component) => ({
              id: component.id,
              name: component.name,
              layer: component.layer,
            }))}
            onRenameProject={(name) => void store.renameProject(name)}
            onSelectComponent={(componentId) => store.selectComponent(componentId)}
            onPlaceComponent={() => void store.placeComponent()}
            onDuplicate={() => void store.duplicateSelected()}
            onSave={() => void store.save()}
          />
        </HudPanel>

        <HudPanel open={hudState.analysis} title="Analysis" onClose={() => toggleHud("analysis")} position="right">
          <AnalysisHud
            drcViolations={store.drcViolations}
            routeStatus={store.routeStatus}
            simulationSummary={store.simulationSummary}
            qualityScore={store.qualityScore}
            onRunDrc={() => void store.runDrc()}
            onRunRoute={() => void store.runRoute()}
            onRunSimulation={() => void store.runSimulation()}
            onRunQualitySuite={() => void store.runQualitySuite()}
          />
        </HudPanel>

        <HudPanel open={hudState.history} title="History" onClose={() => toggleHud("history")} position="right">
          <HistoryHud activityEvents={store.activityEvents} logs={store.logs} />
        </HudPanel>

        {store.selectedComponentId ? (
          <HudPanel open title="Inspector" position="right">
            <InspectorHud
              selectedName={firstComponent?.name ?? "Selection"}
              x={firstComponent?.position.x ?? 0}
              y={firstComponent?.position.y ?? 0}
              layer={firstComponent?.layer ?? 0}
              selectedCount={store.selectedComponentIds.length}
              onRename={(name) => void store.renameSelected(name)}
              onMove={(x, y) => void store.moveSelected(x, y)}
              onSetLayer={(layer) => void store.setSelectedLayer(layer)}
              onDuplicate={() => void store.duplicateSelected()}
              onDelete={() => void store.deleteSelected()}
              onClearSelection={store.clearSelection}
            />
          </HudPanel>
        ) : null}

        <ZenStatusBar
          statusMessage={store.statusMessage}
          busy={store.busy}
          routeStatus={store.routeStatus}
          simulationSummary={store.simulationSummary}
          qualityScore={store.qualityScore}
          viewportZoom={store.canvasViewport.zoom}
          snapEnabled={store.canvasViewport.snapToGrid}
          selectedCount={store.selectedComponentIds.length}
          viewMode={store.viewMode}
        />

        <CommandPalette
          componentCount={componentCount}
          onAlignBottom={() => void store.alignSelection("bottom")}
          onAlignLeft={() => void store.alignSelection("left")}
          onAlignRight={() => void store.alignSelection("right")}
          onAlignTop={() => void store.alignSelection("top")}
          onAutosave={() => void store.autosave()}
          onDistributeHorizontal={() => void store.distributeSelection("horizontal")}
          onDistributeVertical={() => void store.distributeSelection("vertical")}
          onDuplicate={() => void store.duplicateSelected()}
          onExportJson={() => void store.exportJson()}
          onExportSvg={() => void store.exportSvg()}
          onGenerateHealthReport={store.generateHealthReport}
          onImportJson={() => void store.importJson()}
          onOpenChange={store.setPaletteOpen}
          onPlaceComponent={() => void store.placeComponent()}
          onPlaceTemplateGrid={() => void store.placeTemplate("grid_3x3")}
          onPlaceTemplateLine={() => void store.placeTemplate("line_5")}
          onPlaceTemplateRing={() => void store.placeTemplate("ring_8")}
          onRedo={() => void store.redo()}
          onResetViewport={store.resetCanvasViewport}
          onRunDrc={() => void store.runDrc()}
          onRunQualitySuite={() => void store.runQualitySuite()}
          onRunRoute={() => void store.runRoute()}
          onRunSimulation={() => void store.runSimulation()}
          onSave={() => void store.save()}
          onSwitchView={(mode) => store.setViewMode(mode)}
          onToggleSnap={store.toggleCanvasSnap}
          onUndo={() => void store.undo()}
          open={store.paletteOpen}
          projectName={projectName}
          revision={store.project?.revision ?? 0}
          viewMode={store.viewMode}
        />
      </HudPortal>
    </div>
  );
}
