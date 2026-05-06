import { useEffect, useMemo } from "react";
import { BookOpen, FileInput, FolderOpen, Plus, Sparkles } from "lucide-react";
import { PcbCanvas } from "../canvas/PcbCanvas";
import { DesignToolbar } from "../toolbar/DesignToolbar";
import { usePcbStudioStore } from "../../store/pcb-studio-store";
import { BottomPanel } from "./BottomPanel";
import { LeftSidebar } from "./LeftSidebar";
import { RightInspector } from "./RightInspector";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

export function AppShell() {
  const store = usePcbStudioStore();
  const selectedComponent = useMemo(
    () =>
      store.project?.board.components.find(
        (component) => component.id === store.selectedComponentId,
      ) ?? null,
    [store.project?.board.components, store.selectedComponentId],
  );
  const layers = store.project?.board.layers ?? [];
  const activeLayer = layers.find((layer) => layer.visible)?.name ?? "F.Cu";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "s") {
        event.preventDefault();
        store.save();
        return;
      }
      if (key === "escape") store.setActiveTool("select");
      if (key === "v") store.setActiveTool("select");
      if (key === "r") store.setActiveTool("route");
      if (key === "m") store.setActiveTool("measure");
      if (key === "c") store.setActiveTool("add-component");
      if (key === "d") store.runDrc();
      if (key === "f") store.fitView();
      if (key === "l") store.setActiveMode("pcb");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store]);

  return (
    <div className="studio-app-shell">
      <TopBar
        project={store.project}
        activeMode={store.activeMode}
        onMode={store.setActiveMode}
        onSave={store.save}
        onRunDrc={store.runDrc}
      />
      <div className="studio-main-grid">
        <LeftSidebar
          project={store.project}
          activeMode={store.activeMode}
          onOpenDemo={store.openMockProject}
          onCreateProject={store.createEmptyProject}
          onSwitchMode={store.setActiveMode}
        />
        <DesignToolbar
          activeTool={store.activeTool}
          onSelectTool={store.setActiveTool}
        />
        <main className="studio-center">
          {!store.project ? (
            <WelcomeOverlay
              onCreateProject={store.createEmptyProject}
              onOpenDemo={store.openMockProject}
            />
          ) : null}
          <PcbCanvas
            board={store.project?.board ?? null}
            viewport={store.viewport}
            selectedComponentId={store.selectedComponentId}
            onSelectComponent={store.selectComponent}
            onCursorMove={store.updateCursor}
            onZoomBy={store.zoomBy}
          />
        </main>
        <RightInspector
          component={selectedComponent}
          nets={store.project?.nets ?? []}
          layers={layers}
          activeTool={store.activeTool}
          onToggleLayer={store.toggleLayer}
        />
      </div>
      <BottomPanel
        violations={store.project?.drc ?? []}
        selectedViolationId={store.selectedViolationId}
        manufacturing={store.project?.manufacturing ?? []}
        logs={store.logs}
        onSelectViolation={store.selectViolation}
        onRunDrc={store.runDrc}
      />
      <StatusBar
        project={store.project}
        viewport={store.viewport}
        activeLayer={activeLayer}
        onToggleSnap={store.toggleSnap}
        onToggleUnit={store.toggleUnit}
      />
    </div>
  );
}

type WelcomeOverlayProps = {
  onCreateProject: () => void;
  onOpenDemo: () => void;
};

function WelcomeOverlay({ onCreateProject, onOpenDemo }: WelcomeOverlayProps) {
  return (
    <section className="welcome-overlay" aria-label="Project empty state">
      <div className="welcome-card">
        <span className="badge stable">
          <Sparkles size={14} /> Local-first EDA prototype
        </span>
        <h1>Professional PCB studio workspace</h1>
        <p>
          Start from a local project, import a netlist, or load a realistic mock
          board to evaluate routing, DRC, simulation, and manufacturing
          workflows.
        </p>
        <div className="welcome-actions">
          <button type="button" onClick={onCreateProject}>
            <Plus size={16} /> New project
          </button>
          <button type="button" onClick={onOpenDemo}>
            <FolderOpen size={16} /> Load example
          </button>
          <button type="button">
            <FileInput size={16} /> Import netlist
          </button>
          <button type="button">
            <BookOpen size={16} /> Documentation
          </button>
        </div>
      </div>
    </section>
  );
}
