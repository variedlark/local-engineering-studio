export type ViewportSnapshot = {
  id: string;
  name: string;
  createdAt: number;
  viewport: {
    offsetX: number;
    offsetY: number;
    zoom: number;
    showGrid: boolean;
    snapToGrid: boolean;
  };
};

type ViewportSnapshotsPanelProps = {
  snapshots: ViewportSnapshot[];
  activeSnapshotId: string | null;
  onSaveSnapshot: (name: string) => void;
  onApplySnapshot: (id: string) => void;
  onDeleteSnapshot: (id: string) => void;
};

function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}

export function ViewportSnapshotsPanel({
  snapshots,
  activeSnapshotId,
  onSaveSnapshot,
  onApplySnapshot,
  onDeleteSnapshot,
}: ViewportSnapshotsPanelProps) {
  return (
    <section className="stack viewport-snapshots-panel">
      <h2 className="panel-title">Viewport Snapshots</h2>
      <p className="panel-subtle">Capture and restore camera/grid states.</p>
      <button
        className="action-btn"
        onClick={() => onSaveSnapshot(`View ${new Date().toLocaleTimeString()}`)}
        type="button"
      >
        Save Current View
      </button>

      <ul className="list viewport-snapshot-list">
        {snapshots.length === 0 ? (
          <li className="list-item">No snapshots</li>
        ) : (
          snapshots.map((snapshot) => (
            <li
              className={`list-item viewport-snapshot-item ${activeSnapshotId === snapshot.id ? "viewport-snapshot-item-active" : ""}`}
              key={snapshot.id}
            >
              <div className="viewport-snapshot-head">
                <strong>{snapshot.name}</strong>
                <span>{formatWhen(snapshot.createdAt)}</span>
              </div>
              <div className="viewport-snapshot-meta">
                <span>Zoom {(snapshot.viewport.zoom * 100).toFixed(0)}%</span>
                <span>Offset {snapshot.viewport.offsetX},{snapshot.viewport.offsetY}</span>
                <span>Grid {snapshot.viewport.showGrid ? "On" : "Off"}</span>
                <span>Snap {snapshot.viewport.snapToGrid ? "On" : "Off"}</span>
              </div>
              <div className="viewport-snapshot-actions">
                <button className="action-btn" onClick={() => onApplySnapshot(snapshot.id)} type="button">
                  Apply
                </button>
                <button className="action-btn" onClick={() => onDeleteSnapshot(snapshot.id)} type="button">
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
