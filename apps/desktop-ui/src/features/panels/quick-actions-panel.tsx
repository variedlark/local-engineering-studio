type QuickAction = {
  id: string;
  label: string;
  hint: string;
  disabled?: boolean;
  onRun: () => void;
};

type QuickActionsPanelProps = {
  actions: QuickAction[];
};

export function QuickActionsPanel({ actions }: QuickActionsPanelProps) {
  return (
    <section className="stack quick-actions-panel">
      <h2 className="panel-title">Quick Actions</h2>
      <p className="panel-subtle">High-frequency operations grouped for fast execution.</p>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            className="quick-action-card"
            disabled={action.disabled}
            key={action.id}
            onClick={action.onRun}
            type="button"
          >
            <strong>{action.label}</strong>
            <span>{action.hint}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
