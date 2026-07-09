import {
  ChevronRight,
  Cpu,
  FileArchive,
  FileCode2,
  Folder,
  Layers3,
  Plus,
  Rocket,
  Route,
  Sigma,
  Wrench,
} from "lucide-react";
import type { PcbProject, WorkspaceMode } from "../../lib/pcb-types";

const sections = [
  { icon: FileCode2, label: "Schematics", count: 2 },
  { icon: Layers3, label: "Boards", count: 1 },
  { icon: Cpu, label: "Components", count: 6 },
  { icon: Route, label: "Constraints", count: 12 },
  { icon: Sigma, label: "Simulations", count: 3 },
  { icon: FileArchive, label: "Fabrication exports", count: 5 },
];

type ProjectExplorerProps = {
  project: PcbProject | null;
  activeMode: WorkspaceMode;
  onOpenDemo: () => void;
  onCreateProject: () => void;
  onSwitchMode: (mode: WorkspaceMode) => void;
};

export function ProjectExplorer({
  project,
  activeMode,
  onOpenDemo,
  onCreateProject,
  onSwitchMode,
}: ProjectExplorerProps) {
  const isProjectLoaded = !!project;

  return (
    <div className="panel-stack project-explorer">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Workspace</span>
          <h2>Project explorer</h2>
        </div>
        <Folder size={18} />
      </div>

      {project ? (
        <div className="project-card">
          <div className="project-card-header">
            <strong>{project.name}</strong>
            <span className="badge stable">Active</span>
          </div>
          <span>{project.path}</span>
          <div className="project-card-meta">
            <span>Rev {project.revision}</span>
            <span>{project.board.layers.length} layers</span>
          </div>
        </div>
      ) : (
        <div className="project-card project-card-empty">
          <div className="empty-state-content">
            <strong>No project loaded</strong>
            <p>Start by creating a new design or loading an example.</p>
          </div>
          <div className="empty-state-actions">
            <button type="button" onClick={onCreateProject} className="btn-primary">
              <Plus size={14} /> New project
            </button>
            <button type="button" onClick={onOpenDemo}>
              <Rocket size={14} /> Load example
            </button>
          </div>
        </div>
      )}

      <div className="explorer-divider">Design modes</div>
      <nav className="mode-list" aria-label="Design modes">
        {(
          [
            "schematic",
            "pcb",
            "3d",
            "simulation",
            "manufacturing",
          ] as WorkspaceMode[]
        ).map((mode) => (
          <button
            key={mode}
            className={activeMode === mode ? "active" : ""}
            type="button"
            onClick={() => onSwitchMode(mode)}
            disabled={!isProjectLoaded && mode !== "pcb"}
          >
            <ChevronRight size={14} className="mode-chevron" />
            <span className="text-capitalize">{mode.replace("3d", "3D")}</span>
          </button>
        ))}
      </nav>

      <div className="explorer-divider">Resources</div>
      <div className="tree-list">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.label} className={`tree-row ${!isProjectLoaded ? "disabled" : ""}`}>
              <Icon size={15} />
              <span>{section.label}</span>
              <b className="count-badge">{isProjectLoaded ? section.count : 0}</b>
            </div>
          );
        })}
      </div>

      <div className="engine-note">
        <Wrench size={14} />
        <span>Rust/Tauri backend ready for engine synchronization.</span>
      </div>
    </div>
  );
}
