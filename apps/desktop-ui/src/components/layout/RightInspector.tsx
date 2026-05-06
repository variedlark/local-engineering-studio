import type { Component, Layer, Net, ToolMode } from "../../lib/pcb-types";
import { LayerPanel } from "../panels/LayerPanel";
import { PropertiesPanel } from "../panels/PropertiesPanel";

type RightInspectorProps = {
  component: Component | null;
  nets: Net[];
  layers: Layer[];
  activeTool: ToolMode;
  onToggleLayer: (layerId: string) => void;
};

export function RightInspector({
  component,
  nets,
  layers,
  activeTool,
  onToggleLayer,
}: RightInspectorProps) {
  return (
    <aside className="right-inspector">
      <PropertiesPanel
        component={component}
        nets={nets}
        activeTool={activeTool}
      />
      <LayerPanel layers={layers} onToggleLayer={onToggleLayer} />
    </aside>
  );
}
