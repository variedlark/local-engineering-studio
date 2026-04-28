import { memo, useEffect, useMemo, useState } from "react";

type ProjectHudProps = {
  projectName: string;
  revision: number;
  componentCount: number;
  netCount: number;
  selectedCount: number;
  components: Array<{ id: string; name: string; layer: number }>;
  onRenameProject: (name: string) => void;
  onSelectComponent: (componentId: string) => void;
  onPlaceComponent: () => void;
  onDuplicate: () => void;
  onSave: () => void;
};

export const ProjectHud = memo(function ProjectHud({
  projectName,
  revision,
  componentCount,
  netCount,
  selectedCount,
  components,
  onRenameProject,
  onSelectComponent,
  onPlaceComponent,
  onDuplicate,
  onSave,
}: ProjectHudProps) {
  const [draft, setDraft] = useState(projectName);

  useEffect(() => {
    setDraft(projectName);
  }, [projectName]);

  const recentComponents = useMemo(() => components.slice(0, 5), [components]);

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
            placeholder="Project name"
          />
          <button
            type="button"
            onClick={() => onRenameProject(draft)}
            disabled={draft.trim().length === 0}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-white/40">
          <span>r{revision}</span>
          <span>{componentCount} components</span>
          <span>{netCount} nets</span>
          <span>{selectedCount} selected</span>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Recent components</p>
        <div className="mt-2 space-y-1">
          {recentComponents.length === 0 ? (
            <p className="text-xs text-white/40">No components yet.</p>
          ) : (
            recentComponents.map((component) => (
              <button
                key={component.id}
                type="button"
                onClick={() => onSelectComponent(component.id)}
                className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-left text-xs text-white/80 transition hover:bg-white/10"
              >
                <span>{component.name}</span>
                <span className="text-[10px] font-mono text-white/40">L{component.layer}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
        <button
          type="button"
          onClick={onPlaceComponent}
          className="rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          Place
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg border border-white/10 px-2 py-2 transition hover:text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
});
