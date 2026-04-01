import { useEffect, useMemo } from "react";
import { CommandPalette } from "../features/command-palette";
import { ProjectSidebar } from "../features/project-sidebar";
import { InspectorPanel } from "../features/inspector";
import { StatusBar } from "../features/status-bar";
import { CanvasViewport } from "../canvas/CanvasViewport";
import { DEFAULT_PROJECT_NAME } from "../features/ui-store.types";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import { AnalysisPanel } from "../features/panels/analysis-panel";
import { LogPanel } from "../features/panels/log-panel";
import { HistoryPanel } from "../features/panels/history-panel";
import { DashboardPanel } from "../features/panels/dashboard-panel";
import { QuickActionsPanel } from "../features/panels/quick-actions-panel";
import { NotesPanel, type SessionNote } from "../features/panels/notes-panel";
import {
  addSessionNote,
  deleteSessionNote,
  notesDigest,
  toggleSessionNotePinned,
} from "../features/session-notes";
import {
  addViewportSnapshot,
  deleteViewportSnapshot,
  findViewportSnapshot,
} from "../features/viewport-snapshots";
import {
  createQuickActionDefinitions,
  buildFitAllEntries,
  buildNudgeEntries,
  suggestedTemplate,
} from "../features/app-shell-actions";
import { usePersistedState } from "../hooks/use-persisted-state";
import {
  type ViewportSnapshot,
  ViewportSnapshotsPanel,
} from "../features/panels/viewport-snapshots-panel";
import { useAppShellStore, useProjectDerived } from "../features/app-shell-state";
import { useSessionLayout } from "../features/layout/session-layout";
import { buildRecommendations } from "../features/recommendations";
import { RecommendationsPanel } from "../features/panels/recommendations-panel";
import { buildPcpLifecycleReport } from "../features/pcp/pcp-lifecycle";
import { PcpLifecyclePanel } from "../features/panels/pcp-lifecycle-panel";

const SESSION_NOTES_STORAGE_KEY = "les.session.notes.v1";
const VIEWPORT_SNAPSHOTS_STORAGE_KEY = "les.viewport.snapshots.v1";

function shortId(value: string | null) {
  return value ? value.slice(0, 8) : "none";
}

export function AppShell() {
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
    routeOptions,
    workflowHighlights,
  } = useProjectDerived(store.project, store.selectedComponentId);

  const [notes, setNotes] = usePersistedState<SessionNote[]>(
    SESSION_NOTES_STORAGE_KEY,
    [],
    { version: 1 },
  );

  const [viewportSnapshots, setViewportSnapshots] = usePersistedState<ViewportSnapshot[]>(
    VIEWPORT_SNAPSHOTS_STORAGE_KEY,
    [],
    { version: 1 },
  );

  const [activeViewportSnapshotId, setActiveViewportSnapshotId] = usePersistedState<string | null>(
    `${VIEWPORT_SNAPSHOTS_STORAGE_KEY}.active`,
    null,
    { version: 1 },
  );

  const shortcutHint =
    "Cmd/Ctrl+K palette | Cmd/Ctrl+D duplicate | F5 DRC | F6 Route | F7 Sim | F8 Quality";

  const projectName = store.project?.name ?? DEFAULT_PROJECT_NAME;
  const selectedComponentName = firstComponent?.name ?? "None";
  const hasProject = store.project !== null;
  const templateSuggestion = suggestedTemplate(componentCount);

  const sessionLayout = useSessionLayout({
    hasProject,
    notesCount: notes.length,
    snapshotsCount: viewportSnapshots.length,
    viewportZoom: store.canvasViewport.zoom,
  });

  const digest = useMemo(() => notesDigest(notes), [notes]);

  const recommendations = useMemo(
    () =>
      buildRecommendations({
        drcViolations: store.drcViolations,
        qualityScore: store.qualityScore,
        routeStatus: store.routeStatus,
        simulationSummary: store.simulationSummary,
        selectedCount: store.selectedComponentIds.length,
        hasHealthReport: store.healthReport !== null,
        notesCount: notes.length,
        pinnedNotesCount: digest.pinned,
      }),
    [
      digest.pinned,
      notes.length,
      store.drcViolations,
      store.healthReport,
      store.qualityScore,
      store.routeStatus,
      store.selectedComponentIds.length,
      store.simulationSummary,
    ],
  );

  const pcpLifecycleReport = useMemo(
    () =>
      buildPcpLifecycleReport(store.project, {
        minSpacingUm: store.rules.minSpacingUm,
        gridStepUm: store.rules.gridStepUm,
      }),
    [store.project, store.rules.gridStepUm, store.rules.minSpacingUm],
  );

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
      document.documentElement.dataset.layout = sessionLayout.variant;
    }
  }, [isTest, sessionLayout.variant, workspacePreferences.accent, workspacePreferences.density]);

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

  const nudgeSelection = (dx: number, dy: number) => {
    const entries = buildNudgeEntries(store.selectedComponentIds, inspectorComponents, dx, dy);
    if (entries.length === 1) {
      const entry = entries[0];
      void store.moveComponentTo(entry.componentId, entry.x, entry.y);
      return;
    }
    if (entries.length > 1) {
      void store.moveMany(entries);
    }
  };

  const fitAll = () => {
    const step = store.workspacePreferences.coordinateStepUm;
    const entries = buildFitAllEntries(inspectorComponents, step);
    if (entries.length > 0) {
      void store.moveMany(entries);
    }
  };

  const centerSelection = () => {
    if (!firstComponent) {
      return;
    }
    store.setCanvasOffset(0, 0);
    void store.moveSelected(0, 0);
  };

  const quickActions = createQuickActionDefinitions({
    selectedCount: store.selectedComponentIds.length,
    hasProject,
    onPlaceComponent: () => void store.placeComponent(),
    onPlaceTemplate: (template) => void store.placeTemplate(template),
    template: templateSuggestion,
    onDuplicate: () => void store.duplicateSelected(),
    onQualitySuite: () => void store.runQualitySuite(),
    onDrc: () => void store.runDrc(),
    onRoute: () => void store.runRoute(),
    onSimulation: () => void store.runSimulation(),
    onUndo: () => void store.undo(),
    onRedo: () => void store.redo(),
    onSave: () => void store.save(),
    onAutosave: () => void store.autosave(),
    onAlignCenterX: () => void store.alignSelection("center_x"),
    onDistributeHorizontal: () => void store.distributeSelection("horizontal"),
    onToggleSnap: () => store.toggleCanvasSnap(),
    onResetViewport: () => store.resetCanvasViewport(),
    onOpenPalette: () => store.togglePalette(),
  });

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

  const addNote = (text: string) => {
    setNotes((previous) => addSessionNote(previous, text));
  };

  const toggleNote = (id: string) => {
    setNotes((previous) => toggleSessionNotePinned(previous, id));
  };

  const removeNote = (id: string) => {
    setNotes((previous) => deleteSessionNote(previous, id));
  };

  const saveViewportSnapshot = (name: string) => {
    setViewportSnapshots((previous) => addViewportSnapshot(previous, store.canvasViewport, name));
  };

  const applyViewportSnapshot = (id: string) => {
    const snapshot = findViewportSnapshot(viewportSnapshots, id);
    if (!snapshot) {
      return;
    }
    store.setCanvasViewport(snapshot.viewport);
    setActiveViewportSnapshotId(id);
  };

  const removeViewportSnapshot = (id: string) => {
    setViewportSnapshots((previous) => deleteViewportSnapshot(previous, id));
    if (activeViewportSnapshotId === id) {
      setActiveViewportSnapshotId(null);
    }
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">Local Engineering Studio</div>
        <div className="topbar-actions">
          {quickActions.slice(0, 10).map((action) => (
            <button
              className="action-btn"
              disabled={action.disabled}
              key={action.id}
              onClick={action.onRun}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="topbar-workflow-highlights" aria-label="workflow highlights">
          {workflowHighlights.map((headline) => (
            <span className="topbar-workflow-pill" key={headline}>
              {headline}
            </span>
          ))}
        </div>
      </header>

      <main className="workspace-grid workspace-grid-extended">
        <aside className="panel panel-left">
          <ProjectSidebar
            componentCount={componentCount}
            components={inspectorComponents.map((component) => ({
              id: component.id,
              name: component.name,
              layer: component.layer,
            }))}
            netCount={netCount}
            onRenameProject={(name) => void store.renameProject(name)}
            onSelectComponent={(componentId) => store.selectComponent(componentId)}
            onToggleComponentSelection={(componentId) => store.toggleComponentSelection(componentId)}
            projectName={projectName}
            revision={store.project?.revision ?? 0}
            selectedComponentId={store.selectedComponentId}
            selectedComponentIds={store.selectedComponentIds}
          />
        </aside>

        <section className="canvas-area">
          <CanvasViewport
            componentCount={componentCount}
            components={inspectorComponents}
            onCenterSelection={centerSelection}
            onClearSelection={store.clearSelection}
            onFitAll={fitAll}
            onMoveComponent={(componentId, x, y) => void store.moveComponentTo(componentId, x, y)}
            onMoveSelectedBy={(dx, dy) => nudgeSelection(dx, dy)}
            onPanBy={store.panCanvasBy}
            onPlaceComponent={() => void store.placeComponent()}
            onResetViewport={store.resetCanvasViewport}
            onSelectComponent={(componentId) => store.selectComponent(componentId)}
            onToggleComponentSelection={(componentId) => store.toggleComponentSelection(componentId)}
            onToggleGrid={store.toggleCanvasGrid}
            onToggleSnap={store.toggleCanvasSnap}
            onZoomBy={store.zoomCanvasBy}
            routePath={store.routePath}
            routeStatus={store.routeStatus}
            selectedComponentIds={store.selectedComponentIds}
            selectedComponentName={selectedComponentName}
            simulationSummary={store.simulationSummary}
            viewport={store.canvasViewport}
          />
        </section>

        <aside className="panel panel-right">
          <InspectorPanel
            components={inspectorComponents}
            layer={firstComponent?.layer ?? 0}
            onAlignBottom={() => void store.alignSelection("bottom")}
            onAlignLeft={() => void store.alignSelection("left")}
            onAlignRight={() => void store.alignSelection("right")}
            onAlignTop={() => void store.alignSelection("top")}
            onClearSelection={store.clearSelection}
            onDelete={() => void store.deleteSelected()}
            onDuplicate={() => void store.duplicateSelected()}
            onMove={(x, y) => void store.moveSelected(x, y)}
            onRename={(name) => void store.renameSelected(name)}
            onSelectComponent={(componentId) => store.selectComponent(componentId || null)}
            onSetLayer={(layer) => void store.setSelectedLayer(layer)}
            onToggleComponentSelection={(componentId) => store.toggleComponentSelection(componentId)}
            selectedComponentId={store.selectedComponentId}
            selectedComponentIds={store.selectedComponentIds}
            selectedName={firstComponent?.name ?? "No selection"}
            x={firstComponent?.position.x ?? 0}
            y={firstComponent?.position.y ?? 0}
          />
        </aside>

        <aside className="panel panel-analysis">
          <AnalysisPanel
            drcViolations={store.drcViolations}
            healthReport={store.healthReport}
            onAlignSelection={(mode) => void store.alignSelection(mode)}
            onApplyWorkspacePreset={store.applyWorkspacePreset}
            onClearLogs={store.clearLogs}
            onDeleteWorkspacePreset={store.deleteWorkspacePreset}
            onDistributeSelection={(axis) => void store.distributeSelection(axis)}
            onExportJson={() => void store.exportJson()}
            onExportSvg={() => void store.exportSvg()}
            onGenerateHealthReport={store.generateHealthReport}
            onImportJson={() => void store.importJson()}
            onPlaceTemplate={(template) => void store.placeTemplate(template)}
            onRunDrc={() => void store.runDrc()}
            onRunQualitySuite={() => void store.runQualitySuite()}
            onRunRoute={() => void store.runRoute()}
            onRunSimulation={() => void store.runSimulation()}
            onSaveWorkspacePreset={store.saveWorkspacePreset}
            onSetRouteEndpoints={store.setRouteEndpoints}
            onSetSimulationConfig={store.setSimulationConfig}
            onUpdateRules={(nextRules) => void store.updateRules(nextRules)}
            onUpdateWorkspacePreferences={store.updateWorkspacePreferences}
            qualityScore={store.qualityScore}
            qualitySummary={store.qualitySummary}
            routeFrom={store.routeEndpoints.from}
            routeOptions={routeOptions}
            routeStatus={store.routeStatus}
            routeTo={store.routeEndpoints.to}
            rules={store.rules}
            selectionCount={store.selectedComponentIds.length}
            simulationConfig={store.simulationConfig}
            simulationSummary={store.simulationSummary}
            workspacePreferences={store.workspacePreferences}
            workspacePresets={store.workspacePresets}
          />
        </aside>
      </main>

      <section className="workspace-grid workspace-grid-bottom" aria-label="Operational support panels">
        <section className="panel panel-dashboard">
          <DashboardPanel
            activityEvents={store.activityEvents}
            componentCount={componentCount}
            drcViolations={store.drcViolations}
            healthReport={store.healthReport}
            netCount={netCount}
            projectName={projectName}
            qualityScore={store.qualityScore}
            qualitySummary={store.qualitySummary}
            revision={store.project?.revision ?? 0}
            routeStatus={store.routeStatus}
            selectedCount={store.selectedComponentIds.length}
            simulationSummary={store.simulationSummary}
          />
        </section>

        <section className="panel panel-quick-actions">
          <QuickActionsPanel actions={quickActions} />
        </section>

        <section className="panel panel-notes">
          <NotesPanel notes={notes} onAddNote={addNote} onDeleteNote={removeNote} onTogglePinned={toggleNote} />
        </section>

        <section className="panel panel-viewports">
          <ViewportSnapshotsPanel
            activeSnapshotId={activeViewportSnapshotId}
            onApplySnapshot={applyViewportSnapshot}
            onDeleteSnapshot={removeViewportSnapshot}
            onSaveSnapshot={saveViewportSnapshot}
            snapshots={viewportSnapshots}
          />
        </section>

        <section className="panel panel-recommendations">
          <RecommendationsPanel recommendations={recommendations} />
        </section>

        <section className="panel panel-pcp-lifecycle">
          <PcpLifecyclePanel report={pcpLifecycleReport} />
        </section>
      </section>

      <section className="activity-grid" aria-label="Activity and history panels">
        <section className="panel panel-log">
          <LogPanel entries={store.logs} />
        </section>
        <section className="panel panel-history">
          <HistoryPanel
            events={store.activityEvents}
            onClear={store.clearActivity}
            onReplayTo={(index) => void store.replayHistoryTo(index)}
          />
        </section>
      </section>

      <footer className="status-area">
        <StatusBar
          busy={store.busy}
          componentCount={componentCount}
          dirty={store.project?.dirty ?? false}
          qualityScore={store.qualityScore}
          qualitySummary={`${store.qualitySummary} | Notes ${digest.count} pinned ${digest.pinned}`}
          revision={store.project?.revision ?? 0}
          routeStatus={`${store.routeStatus} (${shortId(store.routeEndpoints.from)} -> ${shortId(store.routeEndpoints.to)})`}
          selectedCount={store.selectedComponentIds.length}
          shortcutHint={shortcutHint}
          showShortcutHint={store.workspacePreferences.showStatusHints}
          simulationSummary={store.simulationSummary}
          snapEnabled={store.canvasViewport.snapToGrid}
          statusMessage={store.statusMessage}
          viewportZoom={store.canvasViewport.zoom}
        />
      </footer>

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
        onToggleSnap={store.toggleCanvasSnap}
        onUndo={() => void store.undo()}
        open={store.paletteOpen}
        projectName={projectName}
        revision={store.project?.revision ?? 0}
      />
    </div>
  );
}
