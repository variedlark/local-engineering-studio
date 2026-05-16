import {
  Component,
  Crosshair,
  Inspect,
  Layers,
  MousePointer2,
  Move,
  PencilRuler,
  Route,
  Ruler,
  Send,
  Waypoints,
} from "lucide-react";
import type { ToolMode } from "../../lib/pcb-types";
import { ToolButton } from "./ToolButton";

const tools: Array<{
  id: ToolMode;
  label: string;
  shortcut: string;
  icon: typeof MousePointer2;
}> = [
  { id: "select", label: "Select", shortcut: "V", icon: MousePointer2 },
  { id: "move", label: "Move", shortcut: "V", icon: Move },
  { id: "route", label: "Interactive route", shortcut: "R", icon: Route },
  { id: "via", label: "Place via", shortcut: "Shift+V", icon: Waypoints },
  { id: "track", label: "Track segment", shortcut: "T", icon: Send },
  { id: "copper-zone", label: "Copper zone", shortcut: "Z", icon: Layers },
  { id: "measure", label: "Measure", shortcut: "M", icon: Ruler },
  {
    id: "add-component",
    label: "Add component",
    shortcut: "C",
    icon: Component,
  },
  { id: "inspect", label: "Inspect", shortcut: "I", icon: Inspect },
  { id: "comment", label: "Annotation", shortcut: "A", icon: PencilRuler },
];

type DesignToolbarProps = {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
};

export function DesignToolbar({
  activeTool,
  onSelectTool,
}: DesignToolbarProps) {
  return (
    <aside className="studio-toolbar" aria-label="PCB design tools">
      <div className="studio-toolbar-mark">
        <Crosshair size={16} />
      </div>
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <ToolButton
            key={tool.id}
            active={activeTool === tool.id}
            icon={<Icon size={17} />}
            label={tool.label}
            shortcut={tool.shortcut}
            onClick={() => onSelectTool(tool.id)}
          />
        );
      })}
    </aside>
  );
}
