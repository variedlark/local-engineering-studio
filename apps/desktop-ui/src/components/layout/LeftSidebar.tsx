import type { PcbProject, WorkspaceMode } from "../../lib/pcb-types";
import { ProjectExplorer } from "../panels/ProjectExplorer";

type LeftSidebarProps = {
  project: PcbProject | null;
  activeMode: WorkspaceMode;
  onOpenDemo: () => void;
  onCreateProject: () => void;
  onSwitchMode: (mode: WorkspaceMode) => void;
};

export function LeftSidebar(props: LeftSidebarProps) {
  return (
    <aside className="left-sidebar">
      <ProjectExplorer {...props} />
    </aside>
  );
}
