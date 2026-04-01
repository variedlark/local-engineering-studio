import { useEffect, useMemo, useState } from "react";

type SidebarComponent = {
  id: string;
  name: string;
  layer: number;
};

type GroupedLayer = {
  layer: number;
  components: SidebarComponent[];
};

type ProjectSidebarProps = {
  revision: number;
  projectName: string;
  componentCount: number;
  netCount: number;
  components: SidebarComponent[];
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  onSelectComponent: (componentId: string) => void;
  onToggleComponentSelection: (componentId: string) => void;
  onRenameProject: (name: string) => void;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function groupByLayer(components: SidebarComponent[]): GroupedLayer[] {
  const map = new Map<number, SidebarComponent[]>();
  for (const component of components) {
    const list = map.get(component.layer);
    if (list) {
      list.push(component);
    } else {
      map.set(component.layer, [component]);
    }
  }

  return Array.from(map.entries())
    .map(([layer, entries]) => ({
      layer,
      components: entries.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.layer - b.layer);
}

function selectionSummary(selectedComponentIds: string[], total: number) {
  if (selectedComponentIds.length === 0) {
    return "No selection";
  }
  if (selectedComponentIds.length === 1) {
    return `1 selected / ${total}`;
  }
  return `${selectedComponentIds.length} selected / ${total}`;
}

export function ProjectSidebar({
  revision,
  projectName,
  componentCount,
  netCount,
  components,
  selectedComponentId,
  selectedComponentIds,
  onSelectComponent,
  onToggleComponentSelection,
  onRenameProject,
}: ProjectSidebarProps) {
  const [query, setQuery] = useState("");
  const [projectNameDraft, setProjectNameDraft] = useState(projectName);
  const [showByLayer, setShowByLayer] = useState(true);
  const [onlySelected, setOnlySelected] = useState(false);

  useEffect(() => {
    setProjectNameDraft(projectName);
  }, [projectName]);

  const selectedSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);

  const filtered = useMemo(() => {
    const normalized = normalize(query);
    return components
      .filter((component) =>
        normalized.length === 0
          ? true
          : normalize(component.name).includes(normalized) || normalize(component.id).includes(normalized),
      )
      .filter((component) => (onlySelected ? selectedSet.has(component.id) : true));
  }, [components, onlySelected, query, selectedSet]);

  const grouped = useMemo(() => groupByLayer(filtered), [filtered]);

  const selectedEntry = useMemo(
    () => components.find((component) => component.id === selectedComponentId) ?? null,
    [components, selectedComponentId],
  );

  return (
    <section className="stack">
      <div className="panel-heading">
        <h2 className="panel-title">Project Structure</h2>
        <span className="panel-subtle">r{revision}</span>
      </div>

      <div className="meta-card">
        <label>
          Project Name
          <input
            className="field"
            onChange={(event) => setProjectNameDraft(event.target.value)}
            value={projectNameDraft}
          />
        </label>
        <button
          className="action-btn"
          disabled={projectNameDraft.trim().length === 0}
          onClick={() => onRenameProject(projectNameDraft)}
          type="button"
        >
          Rename Project
        </button>
        <div className="project-stats-grid">
          <span>{componentCount} components</span>
          <span>{netCount} nets</span>
          <span>{selectionSummary(selectedComponentIds, componentCount)}</span>
          <span>{showByLayer ? "Grouped by layer" : "Flat list"}</span>
        </div>
      </div>

      <div className="sidebar-filters">
        <input
          className="field"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or id..."
          value={query}
        />
        <label className="inline-toggle">
          <input checked={showByLayer} onChange={(event) => setShowByLayer(event.target.checked)} type="checkbox" />
          <span>Group by layer</span>
        </label>
        <label className="inline-toggle">
          <input
            checked={onlySelected}
            onChange={(event) => setOnlySelected(event.target.checked)}
            type="checkbox"
          />
          <span>Show selected only</span>
        </label>
      </div>

      {showByLayer ? (
        <div className="layer-groups">
          {grouped.length === 0 ? (
            <div className="list-item">No components yet</div>
          ) : (
            grouped.map((group) => (
              <div className="layer-group" key={group.layer}>
                <div className="layer-group-header">
                  <strong>Layer {group.layer}</strong>
                  <span>{group.components.length}</span>
                </div>
                <ul className="list">
                  {group.components.map((entry) => {
                    const isPrimary = selectedComponentId === entry.id;
                    const isSelected = selectedSet.has(entry.id);
                    return (
                      <li className="list-item" key={entry.id}>
                        <div className="component-row-wrap">
                          <button
                            className={isPrimary ? "component-row component-row-active" : "component-row"}
                            onClick={() => onSelectComponent(entry.id)}
                            type="button"
                          >
                            <span>{entry.name}</span>
                            <span>{shortId(entry.id)}</span>
                          </button>
                          <button
                            className="selection-toggle"
                            onClick={() => onToggleComponentSelection(entry.id)}
                            type="button"
                          >
                            {isSelected ? "Selected" : "Add"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : (
        <ul className="list">
          {filtered.length === 0 ? (
            <li className="list-item">No components match filter</li>
          ) : (
            filtered.map((entry) => {
              const isPrimary = selectedComponentId === entry.id;
              const isSelected = selectedSet.has(entry.id);
              return (
                <li className="list-item" key={entry.id}>
                  <div className="component-row-wrap">
                    <button
                      className={isPrimary ? "component-row component-row-active" : "component-row"}
                      onClick={() => onSelectComponent(entry.id)}
                      type="button"
                    >
                      <span>{entry.name}</span>
                      <span>L{entry.layer}</span>
                    </button>
                    <button
                      className="selection-toggle"
                      onClick={() => onToggleComponentSelection(entry.id)}
                      type="button"
                    >
                      {isSelected ? "Selected" : "Add"}
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      <div className="meta-card">
        <strong>Selection</strong>
        <span>{selectedEntry ? selectedEntry.name : "None"}</span>
        <span>{selectedEntry ? `Layer ${selectedEntry.layer}` : "No layer"}</span>
      </div>
    </section>
  );
}
