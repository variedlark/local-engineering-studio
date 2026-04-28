import { Layers, Move, Tag, Trash2, Copy, XCircle } from "lucide-react";
import { memo, useEffect, useState } from "react";

type InspectorHudProps = {
  selectedName: string;
  x: number;
  y: number;
  layer: number;
  selectedCount: number;
  onRename: (name: string) => void;
  onMove: (x: number, y: number) => void;
  onSetLayer: (layer: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
};

function asInteger(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export const InspectorHud = memo(function InspectorHud({
  selectedName,
  x,
  y,
  layer,
  selectedCount,
  onRename,
  onMove,
  onSetLayer,
  onDuplicate,
  onDelete,
  onClearSelection,
}: InspectorHudProps) {
  const [nameDraft, setNameDraft] = useState(selectedName);
  const [xDraft, setXDraft] = useState(x.toString());
  const [yDraft, setYDraft] = useState(y.toString());
  const [layerDraft, setLayerDraft] = useState(layer.toString());

  useEffect(() => {
    setNameDraft(selectedName);
    setXDraft(x.toString());
    setYDraft(y.toString());
    setLayerDraft(layer.toString());
  }, [selectedName, x, y, layer]);

  const applyMove = () => {
    const nextX = asInteger(xDraft);
    const nextY = asInteger(yDraft);
    if (nextX === null || nextY === null) {
      return;
    }
    onMove(nextX, nextY);
  };

  const applyLayer = () => {
    const nextLayer = asInteger(layerDraft);
    if (nextLayer === null) {
      return;
    }
    onSetLayer(nextLayer);
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>{selectedCount} selected</span>
        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          <XCircle className="h-3 w-3" /> Clear
        </button>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs text-white/60">
          <Tag className="h-3 w-3" />
          <span className="sr-only">Name</span>
          <input
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
            placeholder="Selection name"
          />
        </label>
        <button
          type="button"
          onClick={() => onRename(nameDraft)}
          disabled={nameDraft.trim().length === 0}
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:text-white disabled:opacity-40"
        >
          Apply Name
        </button>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-xs text-white/60">
            <Move className="h-3 w-3" />
            <span className="sr-only">X</span>
            <input
              value={xDraft}
              onChange={(event) => setXDraft(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 focus:outline-none"
              type="number"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <Move className="h-3 w-3" />
            <span className="sr-only">Y</span>
            <input
              value={yDraft}
              onChange={(event) => setYDraft(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 focus:outline-none"
              type="number"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={applyMove}
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
        >
          Apply Position
        </button>

        <label className="flex items-center gap-2 text-xs text-white/60">
          <Layers className="h-3 w-3" />
          <span className="sr-only">Layer</span>
          <input
            value={layerDraft}
            onChange={(event) => setLayerDraft(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 focus:outline-none"
            type="number"
          />
        </label>
        <button
          type="button"
          onClick={applyLayer}
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
        >
          Apply Layer
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          <Copy className="h-3 w-3" /> Duplicate
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>
    </div>
  );
});
