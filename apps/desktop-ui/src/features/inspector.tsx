import { useEffect, useMemo, useState } from "react";

type InspectorPanelProps = {
  components: Array<{ id: string; name: string; x: number; y: number; layer: number }>;
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  onSelectComponent: (componentId: string) => void;
  onToggleComponentSelection: (componentId: string) => void;
  onClearSelection: () => void;
  onRename: (name: string) => void;
  onMove: (x: number, y: number) => void;
  onSetLayer: (layer: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlignLeft: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  selectedName: string;
  x: number;
  y: number;
  layer: number;
};

function asInteger(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function positionBounds(components: Array<{ x: number; y: number }>) {
  if (components.length === 0) {
    return null;
  }
  const xs = components.map((component) => component.x);
  const ys = components.map((component) => component.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function InspectorPanel({
  components,
  selectedComponentId,
  selectedComponentIds,
  onSelectComponent,
  onToggleComponentSelection,
  onClearSelection,
  onRename,
  onMove,
  onSetLayer,
  onDuplicate,
  onDelete,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  selectedName,
  x,
  y,
  layer,
}: InspectorPanelProps) {
  const [nameDraft, setNameDraft] = useState(selectedName);
  const [xDraft, setXDraft] = useState(x.toString());
  const [yDraft, setYDraft] = useState(y.toString());
  const [layerDraft, setLayerDraft] = useState(layer.toString());

  useEffect(() => {
    setNameDraft(selectedName);
    setXDraft(x.toString());
    setYDraft(y.toString());
    setLayerDraft(layer.toString());
  }, [selectedName, x, y, layer, selectedComponentId]);

  const selectedSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);

  const selectedComponents = useMemo(
    () => components.filter((component) => selectedSet.has(component.id)),
    [components, selectedSet],
  );

  const bounds = useMemo(() => positionBounds(selectedComponents), [selectedComponents]);
  const disabled = selectedComponentId === null;

  const applyPosition = () => {
    const xValue = asInteger(xDraft);
    const yValue = asInteger(yDraft);
    if (xValue === null || yValue === null) {
      return;
    }
    onMove(xValue, yValue);
  };

  const applyLayer = () => {
    const layerValue = asInteger(layerDraft);
    if (layerValue === null) {
      return;
    }
    onSetLayer(layerValue);
  };

  return (
    <section className="stack">
      <h2 className="panel-title">Inspector</h2>
      <div className="inspector-grid">
        <label>
          Primary Selection
          <select
            className="field"
            onChange={(event) => onSelectComponent(event.target.value)}
            value={selectedComponentId ?? ""}
          >
            <option value="">None</option>
            {components.map((component) => (
              <option key={component.id} value={component.id}>
                {component.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Name
          <input
            className="field"
            disabled={disabled}
            onChange={(event) => setNameDraft(event.target.value)}
            value={nameDraft}
          />
        </label>
        <button
          className="action-btn"
          disabled={disabled || nameDraft.trim().length === 0}
          onClick={() => onRename(nameDraft)}
          type="button"
        >
          Apply Name
        </button>

        <label>
          Position X
          <input
            className="field"
            disabled={disabled}
            onChange={(event) => setXDraft(event.target.value)}
            type="number"
            value={xDraft}
          />
        </label>
        <label>
          Position Y
          <input
            className="field"
            disabled={disabled}
            onChange={(event) => setYDraft(event.target.value)}
            type="number"
            value={yDraft}
          />
        </label>
        <button className="action-btn" disabled={disabled} onClick={applyPosition} type="button">
          Apply Position
        </button>

        <label>
          Layer
          <input
            className="field"
            disabled={disabled}
            max={32}
            min={-32}
            onChange={(event) => setLayerDraft(event.target.value)}
            type="number"
            value={layerDraft}
          />
        </label>
        <button className="action-btn" disabled={disabled} onClick={applyLayer} type="button">
          Apply Layer
        </button>

        <div className="inspector-actions-row">
          <button className="action-btn" disabled={disabled} onClick={onDuplicate} type="button">
            Duplicate
          </button>
          <button className="action-btn" disabled={disabled} onClick={onDelete} type="button">
            Delete
          </button>
          <button
            className="action-btn"
            disabled={selectedComponentIds.length === 0}
            onClick={onClearSelection}
            type="button"
          >
            Clear Selection
          </button>
        </div>

        <div className="inspector-layout-tools">
          <strong>Layout Tools</strong>
          <div className="inspector-actions-row">
            <button
              className="action-btn"
              disabled={selectedComponentIds.length < 2}
              onClick={onAlignLeft}
              type="button"
            >
              Align Left
            </button>
            <button
              className="action-btn"
              disabled={selectedComponentIds.length < 2}
              onClick={onAlignRight}
              type="button"
            >
              Align Right
            </button>
            <button
              className="action-btn"
              disabled={selectedComponentIds.length < 2}
              onClick={onAlignTop}
              type="button"
            >
              Align Top
            </button>
            <button
              className="action-btn"
              disabled={selectedComponentIds.length < 2}
              onClick={onAlignBottom}
              type="button"
            >
              Align Bottom
            </button>
          </div>
        </div>

        <div className="meta-card">
          <strong>Selection Stats</strong>
          <span>{selectedComponentIds.length} selected</span>
          {bounds ? (
            <>
              <span>
                X: {bounds.minX}..{bounds.maxX}
              </span>
              <span>
                Y: {bounds.minY}..{bounds.maxY}
              </span>
            </>
          ) : (
            <span>No active bounds</span>
          )}
        </div>

        <div className="inspector-selection-list">
          <strong>Selection Set</strong>
          <ul className="list">
            {components.length === 0 ? (
              <li className="list-item">No components</li>
            ) : (
              components.slice(0, 20).map((component) => {
                const selected = selectedSet.has(component.id);
                return (
                  <li className="list-item" key={component.id}>
                    <div className="component-row-wrap">
                      <span>{component.name}</span>
                      <button
                        className="selection-toggle"
                        onClick={() => onToggleComponentSelection(component.id)}
                        type="button"
                      >
                        {selected ? "Selected" : "Add"}
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
