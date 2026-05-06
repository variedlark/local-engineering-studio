type ConsolePanelProps = { logs: string[] };

export function ConsolePanel({ logs }: ConsolePanelProps) {
  return (
    <div className="bottom-tab-content console-panel">
      {logs.map((log, index) => (
        <code key={`${log}-${index}`}>{log}</code>
      ))}
    </div>
  );
}
