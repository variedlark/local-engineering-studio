import type { ManufacturingExport } from "../../lib/pcb-types";

type ManufacturingPanelProps = { exports: ManufacturingExport[] };

export function ManufacturingPanel({
  exports: manufacturingExports,
}: ManufacturingPanelProps) {
  return (
    <div className="bottom-tab-content manufacturing-panel">
      <div className="fab-grid">
        {manufacturingExports.map((item) => (
          <div key={item.id} className="fab-card">
            <b>{item.name}</b>
            <span>{item.detail}</span>
            <em>{item.status}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
