import type { Component, Net, ToolMode } from "../../lib/pcb-types";
import { formatDistance } from "../../lib/units";

type PropertiesPanelProps = {
  component: Component | null;
  nets: Net[];
  activeTool: ToolMode;
};

export function PropertiesPanel({
  component,
  nets,
  activeTool,
}: PropertiesPanelProps) {
  const primaryNet = component?.footprint.pads[0]
    ? nets.find((net) => net.id === component.footprint.pads[0].netId)
    : null;
  return (
    <div className="panel-stack inspector-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Context</span>
          <h2>Inspector</h2>
        </div>
        <span className="badge mock">Mock</span>
      </div>
      {component ? (
        <>
          <div className="selection-title">
            <strong>{component.reference}</strong>
            <span>{component.value}</span>
          </div>
          <dl className="property-grid">
            <dt>Footprint</dt>
            <dd>{component.footprint.name}</dd>
            <dt>Layer</dt>
            <dd>{component.layerId}</dd>
            <dt>Position</dt>
            <dd>
              {formatDistance(component.position.x, "mm")} /{" "}
              {formatDistance(component.position.y, "mm")}
            </dd>
            <dt>Rotation</dt>
            <dd>{component.rotation}°</dd>
            <dt>Primary net</dt>
            <dd>{primaryNet?.name ?? "Unassigned"}</dd>
            <dt>Pads</dt>
            <dd>{component.footprint.pads.length}</dd>
          </dl>
          <div className="routing-card">
            <b>Routing setup</b>
            <span>Tool: {activeTool}</span>
            <span>Width 0.18 mm · Via 0.30/0.62 · Target 90 Ω diff pair</span>
          </div>
        </>
      ) : (
        <div className="empty-panel-copy">
          Select a component, track, via, or DRC finding to inspect electrical
          constraints, net membership, dimensions, and manufacturing rules.
        </div>
      )}
    </div>
  );
}
