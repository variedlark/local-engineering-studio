import type { DrcViolation } from "../../lib/pcb-types";

type DrcPanelProps = {
  violations: DrcViolation[];
  selectedViolationId: string | null;
  onSelectViolation: (id: string) => void;
  onRunDrc: () => void;
};

export function DrcPanel({
  violations,
  selectedViolationId,
  onSelectViolation,
  onRunDrc,
}: DrcPanelProps) {
  return (
    <div className="bottom-tab-content drc-panel">
      <div className="bottom-panel-header">
        <strong>DRC / ERC results</strong>
        <button type="button" onClick={onRunDrc}>
          Run DRC
        </button>
      </div>
      <div className="drc-list">
        {violations.length === 0 ? (
          <span className="empty-panel-copy">
            No DRC results yet. Run checks after importing a netlist or placing
            components.
          </span>
        ) : null}
        {violations.map((violation) => (
          <button
            key={violation.id}
            type="button"
            className={`drc-row severity-${violation.severity} ${selectedViolationId === violation.id ? "active" : ""}`}
            onClick={() => onSelectViolation(violation.id)}
          >
            <span>{violation.severity}</span>
            <strong>{violation.title}</strong>
            <small>{violation.rule}</small>
            <em>{violation.suggestion}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
