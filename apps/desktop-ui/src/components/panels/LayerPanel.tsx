import type { Layer } from "../../lib/pcb-types";

type LayerPanelProps = {
  layers: Layer[];
  onToggleLayer: (layerId: string) => void;
};

export function LayerPanel({ layers, onToggleLayer }: LayerPanelProps) {
  return (
    <div className="panel-stack compact-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Visibility</span>
          <h2>Layers</h2>
        </div>
      </div>
      <div className="layer-list">
        {layers.map((layer) => (
          <button
            key={layer.id}
            type="button"
            className="layer-row"
            onClick={() => onToggleLayer(layer.id)}
            aria-pressed={layer.visible}
          >
            <span
              className="layer-swatch"
              style={{ background: layer.color }}
            />
            <span>{layer.name}</span>
            <b>{layer.visible ? "On" : "Off"}</b>
          </button>
        ))}
      </div>
    </div>
  );
}
