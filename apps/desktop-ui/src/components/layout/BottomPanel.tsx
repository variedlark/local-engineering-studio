import { useState } from "react";
import type { DrcViolation, ManufacturingExport } from "../../lib/pcb-types";
import { ConsolePanel } from "../panels/ConsolePanel";
import { DrcPanel } from "../panels/DrcPanel";
import { ManufacturingPanel } from "../panels/ManufacturingPanel";
import { SimulationPanel } from "../panels/SimulationPanel";

type BottomPanelProps = {
  violations: DrcViolation[];
  selectedViolationId: string | null;
  manufacturing: ManufacturingExport[];
  logs: string[];
  onSelectViolation: (id: string) => void;
  onRunDrc: () => void;
};

type TabId = "drc" | "console" | "netlist" | "simulation" | "manufacturing";

export function BottomPanel(props: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("drc");

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "drc", label: "DRC/ERC", count: props.violations.length },
    { id: "console", label: "Console", count: props.logs.length },
    { id: "netlist", label: "Netlist" },
    { id: "simulation", label: "Simulation" },
    { id: "manufacturing", label: "Manufacturing" },
  ];

  return (
    <section className="bottom-panel" aria-label="Engineering output panel">
      <div className="bottom-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      <div className="bottom-panel-content">
        {activeTab === "drc" && (
          <DrcPanel
            violations={props.violations}
            selectedViolationId={props.selectedViolationId}
            onSelectViolation={props.onSelectViolation}
            onRunDrc={props.onRunDrc}
          />
        )}
        {activeTab === "console" && <ConsolePanel logs={props.logs} />}
        {activeTab === "simulation" && <SimulationPanel />}
        {activeTab === "manufacturing" && (
          <ManufacturingPanel exports={props.manufacturing} />
        )}
        {activeTab === "netlist" && (
          <div className="bottom-tab-content">
            <div className="empty-panel-copy">
              Netlist view is currently being synchronized with the schematic engine.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
