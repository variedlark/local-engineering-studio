import { useEffect, useMemo, useState } from "react";
import {
  type CommandSearchItem,
  groupRankedCommands,
  rankCommands,
} from "./command-search";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaceComponent: () => void;
  onPlaceTemplateLine: () => void;
  onPlaceTemplateRing: () => void;
  onPlaceTemplateGrid: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onAutosave: () => void;
  onRunDrc: () => void;
  onRunRoute: () => void;
  onRunSimulation: () => void;
  onRunQualitySuite: () => void;
  onToggleSnap: () => void;
  onResetViewport: () => void;
  onGenerateHealthReport: () => void;
  onAlignLeft: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  onDistributeHorizontal: () => void;
  onDistributeVertical: () => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onImportJson: () => void;
  projectName: string;
  componentCount: number;
  revision: number;
};

type PaletteCommand = CommandSearchItem;

const MAX_VISIBLE_RESULTS = 18;

function createCommandSet(props: CommandPaletteProps): PaletteCommand[] {
  return [
    {
      id: "place-component",
      label: "Place Component",
      group: "Edit",
      hotkey: "P",
      keywords: ["insert", "component", "node", "place"],
      action: props.onPlaceComponent,
    },
    {
      id: "place-line-template",
      label: "Place Template: Line",
      group: "Templates",
      keywords: ["template", "line", "five", "5"],
      action: props.onPlaceTemplateLine,
    },
    {
      id: "place-ring-template",
      label: "Place Template: Ring",
      group: "Templates",
      keywords: ["template", "ring", "eight", "8"],
      action: props.onPlaceTemplateRing,
    },
    {
      id: "place-grid-template",
      label: "Place Template: Grid",
      group: "Templates",
      keywords: ["template", "grid", "3x3", "matrix"],
      action: props.onPlaceTemplateGrid,
    },
    {
      id: "duplicate",
      label: "Duplicate Selection",
      group: "Edit",
      hotkey: "Cmd/Ctrl+D",
      keywords: ["duplicate", "clone", "copy"],
      action: props.onDuplicate,
    },
    {
      id: "undo",
      label: "Undo",
      group: "History",
      hotkey: "Cmd/Ctrl+Z",
      keywords: ["undo", "revert", "history"],
      action: props.onUndo,
    },
    {
      id: "redo",
      label: "Redo",
      group: "History",
      hotkey: "Cmd/Ctrl+Shift+Z",
      keywords: ["redo", "history"],
      action: props.onRedo,
    },
    {
      id: "save",
      label: "Save Project",
      group: "Project",
      hotkey: "Cmd/Ctrl+S",
      keywords: ["save", "project", "bundle"],
      action: props.onSave,
    },
    {
      id: "autosave",
      label: "Autosave",
      group: "Project",
      hotkey: "Cmd/Ctrl+A",
      keywords: ["autosave", "save", "project"],
      action: props.onAutosave,
    },
    {
      id: "drc",
      label: "Run DRC",
      group: "Analysis",
      hotkey: "F5",
      keywords: ["drc", "spacing", "rules", "analysis"],
      action: props.onRunDrc,
    },
    {
      id: "route",
      label: "Run Route",
      group: "Analysis",
      hotkey: "F6",
      keywords: ["route", "path", "analysis"],
      action: props.onRunRoute,
    },
    {
      id: "simulation",
      label: "Run Simulation",
      group: "Analysis",
      hotkey: "F7",
      keywords: ["simulation", "analyze", "stability"],
      action: props.onRunSimulation,
    },
    {
      id: "quality",
      label: "Run Quality Suite",
      group: "Analysis",
      hotkey: "F8",
      keywords: ["quality", "score", "suite"],
      action: props.onRunQualitySuite,
    },
    {
      id: "health-report",
      label: "Generate Health Report",
      group: "Analysis",
      keywords: ["health", "report", "quality"],
      action: props.onGenerateHealthReport,
    },
    {
      id: "align-left",
      label: "Align Selection Left",
      group: "Layout",
      keywords: ["align", "left", "selection", "layout"],
      action: props.onAlignLeft,
    },
    {
      id: "align-right",
      label: "Align Selection Right",
      group: "Layout",
      keywords: ["align", "right", "selection", "layout"],
      action: props.onAlignRight,
    },
    {
      id: "align-top",
      label: "Align Selection Top",
      group: "Layout",
      keywords: ["align", "top", "selection", "layout"],
      action: props.onAlignTop,
    },
    {
      id: "align-bottom",
      label: "Align Selection Bottom",
      group: "Layout",
      keywords: ["align", "bottom", "selection", "layout"],
      action: props.onAlignBottom,
    },
    {
      id: "distribute-horizontal",
      label: "Distribute Selection Horizontal",
      group: "Layout",
      keywords: ["distribute", "horizontal", "layout"],
      action: props.onDistributeHorizontal,
    },
    {
      id: "distribute-vertical",
      label: "Distribute Selection Vertical",
      group: "Layout",
      keywords: ["distribute", "vertical", "layout"],
      action: props.onDistributeVertical,
    },
    {
      id: "toggle-snap",
      label: "Toggle Snap",
      group: "Viewport",
      hotkey: "G",
      keywords: ["snap", "grid", "viewport"],
      action: props.onToggleSnap,
    },
    {
      id: "reset-viewport",
      label: "Reset Viewport",
      group: "Viewport",
      hotkey: "Cmd/Ctrl+Shift+R",
      keywords: ["reset", "viewport", "camera"],
      action: props.onResetViewport,
    },
    {
      id: "export-json",
      label: "Export JSON",
      group: "I/O",
      keywords: ["export", "json", "io"],
      action: props.onExportJson,
    },
    {
      id: "export-svg",
      label: "Export SVG",
      group: "I/O",
      keywords: ["export", "svg", "io"],
      action: props.onExportSvg,
    },
    {
      id: "import-json",
      label: "Import JSON",
      group: "I/O",
      keywords: ["import", "json", "io"],
      action: props.onImportJson,
    },
  ];
}

export function CommandPalette(props: CommandPaletteProps) {
  const { open, onOpenChange, projectName, componentCount, revision } = props;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(() => createCommandSet(props), [props]);

  const ranked = useMemo(() => {
    return rankCommands(query, commands).slice(0, MAX_VISIBLE_RESULTS);
  }, [commands, query]);

  const grouped = useMemo(() => groupRankedCommands(ranked), [ranked]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const runCommand = (index: number) => {
    const candidate = ranked[index];
    if (!candidate) {
      return;
    }
    candidate.action();
    onOpenChange(false);
    setQuery("");
  };

  if (!open) {
    return null;
  }

  return (
    <div aria-modal="true" className="palette-backdrop" role="dialog">
      <div className="palette-card">
        <div className="palette-header">
          <strong>Command Palette</strong>
          <button className="action-btn" onClick={() => onOpenChange(false)} type="button">
            Close
          </button>
        </div>

        <div className="palette-meta">
          <span>{projectName}</span>
          <span>Rev {revision}</span>
          <span>{componentCount} components</span>
          <span>{ranked.length} matches</span>
        </div>

        <input
          autoFocus
          className="field"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onOpenChange(false);
              setQuery("");
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((previous) => Math.min(previous + 1, Math.max(0, ranked.length - 1)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((previous) => Math.max(0, previous - 1));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              runCommand(activeIndex);
            }
          }}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search commands, groups, hotkeys..."
          value={query}
        />

        <div className="palette-results" role="listbox">
          {grouped.length === 0 ? (
            <div className="list-item">No commands found</div>
          ) : (
            grouped.map((group) => (
              <section className="palette-group" key={group.group}>
                <h3>{group.group}</h3>
                <ul className="list">
                  {group.commands.map((command) => {
                    const globalIndex = ranked.findIndex((entry) => entry.id === command.id);
                    const isActive = globalIndex === activeIndex;
                    return (
                      <li className="list-item" key={command.id}>
                        <button
                          className={`command-item ${isActive ? "command-item-active" : ""}`}
                          onClick={() => runCommand(globalIndex)}
                          type="button"
                        >
                          <span>{command.label}</span>
                          <span className="command-item-meta">{command.hotkey ?? command.group}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
