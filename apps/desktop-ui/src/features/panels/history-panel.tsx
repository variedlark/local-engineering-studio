import { useMemo, useState } from "react";
import type { ActivityEvent } from "../ui-store.types";

type HistoryPanelProps = {
  events: ActivityEvent[];
  onClear: () => void;
  onReplayTo: (index: number) => void;
};

function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}

function eventClass(status: ActivityEvent["status"]) {
  if (status === "ok") {
    return "event-ok";
  }
  if (status === "warn") {
    return "event-warn";
  }
  if (status === "error") {
    return "event-error";
  }
  return "event-info";
}

export function HistoryPanel({ events, onClear, onReplayTo }: HistoryPanelProps) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | ActivityEvent["kind"]>("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      if (kindFilter !== "all" && event.kind !== kindFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return (
        event.title.toLowerCase().includes(normalized) ||
        event.detail.toLowerCase().includes(normalized) ||
        event.kind.toLowerCase().includes(normalized)
      );
    });
  }, [events, kindFilter, query]);

  const eventIndexById = useMemo(() => {
    return new Map(events.map((event, index) => [event.id, index]));
  }, [events]);

  return (
    <section className="stack">
      <div className="panel-heading">
        <h2 className="panel-title">History</h2>
        <button className="action-btn" onClick={onClear} type="button">
          Clear
        </button>
      </div>

      <div className="history-controls">
        <input
          className="field"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search history..."
          value={query}
        />
        <select
          className="field"
          onChange={(event) => setKindFilter(event.target.value as "all" | ActivityEvent["kind"])}
          value={kindFilter}
        >
          <option value="all">All kinds</option>
          <option value="command">command</option>
          <option value="analysis">analysis</option>
          <option value="quality">quality</option>
          <option value="template">template</option>
          <option value="system">system</option>
        </select>
      </div>

      <ul className="list history-list">
        {filtered.length === 0 ? (
          <li className="list-item">No history yet</li>
        ) : (
          filtered.map((event) => (
            <li className={`list-item event-item ${eventClass(event.status)}`} key={event.id}>
              <div className="event-header">
                <strong>{event.title}</strong>
                <span>{formatWhen(event.at)}</span>
              </div>
              <div className="event-meta">
                <span>{event.kind}</span>
                <span>{event.status}</span>
              </div>
              <div className="event-detail">{event.detail}</div>
                <button
                  className="action-btn"
                  disabled={events.length === 0}
                  onClick={() => onReplayTo(eventIndexById.get(event.id) ?? 0)}
                  type="button"
                >
                Replay To Here
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
