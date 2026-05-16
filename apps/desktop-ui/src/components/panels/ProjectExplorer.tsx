import {
  ChevronRight,
  Cpu,
  FileArchive,
  FileCode2,
  Folder,
  Layers3,
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
          <strong>{project.name}</strong>
          <span>{project.path}</span>
          <div className="project-card-meta">
            <span>Rev {project.revision}</span>
            <span>{project.board.layers.length} layers</span>
          </div>
        </div>
      ) : (
        <div className="project-card project-card-empty">
          <strong>No project loaded</strong>
          <span>Create, open, import, or load a typed mock board.</span>
          <button type="button" onClick={onCreateProject}>
            New project
          </button>
          <button type="button" onClick={onOpenDemo}>
            Load example
          </button>
        </div>
      )}
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
          >
            <ChevronRight size={14} /> {mode.replace("3d", "3D")}
          </button>
        ))}
      </nav>
      <div className="tree-list">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.label} className="tree-row">
              <Icon size={15} />
              <span>{section.label}</span>
              <b>{project ? section.count : 0}</b>
            </div>
          );
        })}
      </div>
      <div className="engine-note">
        <Wrench size={14} /> Rust/Tauri backend boundary preserved for future
        engine wiring.
      </div>
    </div>
  );
}
