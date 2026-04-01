type LogPanelProps = {
  entries: string[];
};

export function LogPanel({ entries }: LogPanelProps) {
  const logEntries = entries.slice(0, 60);
  return (
    <section className="stack">
      <h2 className="panel-title">Activity Log</h2>
      <ul className="list log-list">
        {logEntries.length === 0 ? (
          <li className="list-item">No activity yet</li>
        ) : (
          logEntries.map((entry, index) => (
            <li className="list-item" key={`${index}-${entry}`}>
              {entry}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
