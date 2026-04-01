import { useEffect, useMemo, useState } from "react";

export type SessionNote = {
  id: string;
  createdAt: number;
  text: string;
  pinned: boolean;
};

type NotesPanelProps = {
  notes: SessionNote[];
  onAddNote: (text: string) => void;
  onTogglePinned: (id: string) => void;
  onDeleteNote: (id: string) => void;
};

function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

export function NotesPanel({ notes, onAddNote, onTogglePinned, onDeleteNote }: NotesPanelProps) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  useEffect(() => {
    if (draft.length <= 2000) {
      return;
    }
    setDraft((previous) => previous.slice(0, 2000));
  }, [draft]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return notes
      .filter((note) => (showPinnedOnly ? note.pinned : true))
      .filter((note) => (normalized.length === 0 ? true : note.text.toLowerCase().includes(normalized)));
  }, [notes, query, showPinnedOnly]);

  return (
    <section className="stack notes-panel">
      <div className="panel-heading">
        <h2 className="panel-title">Session Notes</h2>
        <span className="panel-subtle">{notes.length} notes</span>
      </div>

      <textarea
        className="field notes-input"
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Capture intent, TODOs, design rationale..."
        value={draft}
      />
      <div className="notes-actions-row">
        <button
          className="action-btn"
          disabled={draft.trim().length === 0}
          onClick={() => {
            const value = draft.trim();
            if (!value) {
              return;
            }
            onAddNote(value);
            setDraft("");
          }}
          type="button"
        >
          Add Note
        </button>
        <span className="panel-subtle">{draft.length}/2000</span>
      </div>

      <div className="notes-controls">
        <input
          className="field"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter notes..."
          value={query}
        />
        <label className="inline-toggle">
          <input
            checked={showPinnedOnly}
            onChange={(event) => setShowPinnedOnly(event.target.checked)}
            type="checkbox"
          />
          <span>Pinned only</span>
        </label>
      </div>

      <ul className="list notes-list">
        {filtered.length === 0 ? (
          <li className="list-item">No notes</li>
        ) : (
          filtered.map((note) => (
            <li className={`list-item notes-item ${note.pinned ? "notes-item-pinned" : ""}`} key={note.id}>
              <div className="notes-item-head">
                <strong>{note.pinned ? "Pinned" : "Note"}</strong>
                <span>{formatWhen(note.createdAt)}</span>
              </div>
              <p>{note.text}</p>
              <div className="notes-item-actions">
                <button className="action-btn" onClick={() => onTogglePinned(note.id)} type="button">
                  {note.pinned ? "Unpin" : "Pin"}
                </button>
                <button className="action-btn" onClick={() => onDeleteNote(note.id)} type="button">
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
