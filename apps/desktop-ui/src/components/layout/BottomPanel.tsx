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

export function BottomPanel(props: BottomPanelProps) {
  return (
    <section className="bottom-panel" aria-label="Engineering output panel">
      <div className="bottom-tabs">
        <span className="active">DRC/ERC</span>
        <span>Console</span>
        <span>Netlist</span>
        <span>Simulation</span>
        <span>Manufacturing</span>
      </div>
      <div className="bottom-panel-grid">
        <DrcPanel
          violations={props.violations}
          selectedViolationId={props.selectedViolationId}
          onSelectViolation={props.onSelectViolation}
          onRunDrc={props.onRunDrc}
        />
        <ConsolePanel logs={props.logs} />
        <SimulationPanel />
        <ManufacturingPanel exports={props.manufacturing} />
      </div>
    </section>
  );
}
