import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Command, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type CommandSearchItem,
  groupRankedCommands,
  rankCommands,
} from "./command-search";
import type { CanvasViewMode } from "./ui-store.types";

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
  onSwitchView: (mode: CanvasViewMode) => void;
  viewMode: CanvasViewMode;
  projectName: string;
  componentCount: number;
  revision: number;
};

type PaletteCommand = CommandSearchItem;

const MAX_VISIBLE_RESULTS = 16;

function createCommandSet(props: CommandPaletteProps): PaletteCommand[] {
  const viewCommands: PaletteCommand[] =
    props.viewMode === "2d"
      ? [
          {
            id: "switch-3d",
            label: "Switch to 3D",
            group: "View",
            keywords: ["3d", "immersive", "depth"],
            action: () => props.onSwitchView("3d"),
          },
        ]
      : [
          {
            id: "switch-2d",
            label: "Switch to 2D",
            group: "View",
            keywords: ["2d", "plan", "schematic"],
            action: () => props.onSwitchView("2d"),
          },
        ];

  return [
    {
      id: "place-riscv",
      label: "Add RISC-V Core",
      group: "Create",
      hotkey: "P",
      keywords: ["insert", "component", "risc-v", "core", "place"],
      action: props.onPlaceComponent,
    },
    {
      id: "place-line-template",
      label: "Quick Template: Line",
      group: "Templates",
      keywords: ["template", "line", "five", "5"],
      action: props.onPlaceTemplateLine,
    },
    {
      id: "place-ring-template",
      label: "Quick Template: Ring",
      group: "Templates",
      keywords: ["template", "ring", "eight", "8"],
      action: props.onPlaceTemplateRing,
    },
    {
      id: "place-grid-template",
      label: "Quick Template: Grid",
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
      id: "thermal",
      label: "Run Thermal Simulation",
      group: "Simulation",
      hotkey: "F7",
      keywords: ["thermal", "simulation", "analyze", "heat"],
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
      keywords: ["snap", "grid", "toggle"],
      action: props.onToggleSnap,
    },
    {
      id: "reset-view",
      label: "Reset View",
      group: "Viewport",
      keywords: ["reset", "view", "zoom"],
      action: props.onResetViewport,
    },
    {
      id: "export-json",
      label: "Export JSON",
      group: "Export",
      keywords: ["export", "json"],
      action: props.onExportJson,
    },
    {
      id: "export-svg",
      label: "Export SVG",
      group: "Export",
      keywords: ["export", "svg"],
      action: props.onExportSvg,
    },
    {
      id: "import-json",
      label: "Import JSON",
      group: "Export",
      keywords: ["import", "json"],
      action: props.onImportJson,
    },
    ...viewCommands,
  ];
}

export function CommandPalette(props: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    setQuery("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [props.open]);

  const commands = useMemo(() => createCommandSet(props), [props]);
  const ranked = useMemo(() => rankCommands(query, commands), [commands, query]);
  const grouped = useMemo(() => groupRankedCommands(ranked), [ranked]);
  const limitedGroups = useMemo(() => {
    let count = 0;
    return grouped
      .map((group) => ({
        group: group.group,
        commands: group.commands.filter(() => {
          if (count >= MAX_VISIBLE_RESULTS) {
            return false;
          }
          count += 1;
          return true;
        }),
      }))
      .filter((group) => group.commands.length > 0);
  }, [grouped]);

  const runAction = (action: () => void) => {
    action();
    props.onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {props.open ? (
        <Dialog
          static
          open={props.open}
          onClose={props.onOpenChange}
          className="relative z-50 pointer-events-auto"
        >
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 flex items-start justify-center px-4 pt-[12vh]">
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-2xl"
            >
              <Dialog.Panel className="rounded-2xl border border-white/10 bg-[var(--les-surface-strong)]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <Search className="h-4 w-4 text-white/60" />
                <input
                  ref={inputRef}
                  className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/40 focus:outline-none"
                  placeholder="Search commands, components, or views…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <span className="flex items-center gap-1 text-[10px] font-mono text-white/40">
                  <Command className="h-3 w-3" /> K
                </span>
              </div>

              <div className="max-h-[50vh] space-y-4 overflow-auto pt-3">
                {limitedGroups.length === 0 ? (
                  <p className="text-sm text-white/50">No commands found.</p>
                ) : (
                  limitedGroups.map((group) => (
                    <div key={group.group}>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                        {group.group}
                      </p>
                      <div className="mt-2 space-y-1">
                        {group.commands.map((command) => (
                          <button
                            key={command.id}
                            onClick={() => runAction(command.action)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/85 transition hover:bg-white/5"
                            type="button"
                          >
                            <span>{command.label}</span>
                            {command.hotkey ? (
                              <span className="text-[10px] font-mono text-white/40">
                                {command.hotkey}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

                <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>{props.projectName}</span>
                  <span>
                    r{props.revision} · {props.componentCount} components
                  </span>
                </div>
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      ) : null}
    </AnimatePresence>
  );
}
