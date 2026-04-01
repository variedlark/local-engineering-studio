import type { SessionNote } from "./panels/notes-panel";

function nowMs() {
  return Date.now();
}

function noteId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSessionNote(text: string): SessionNote {
  return {
    id: noteId(),
    createdAt: nowMs(),
    text,
    pinned: false,
  };
}

export function sortSessionNotes(notes: SessionNote[]) {
  const copy = [...notes];
  copy.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.createdAt - a.createdAt;
  });
  return copy;
}

export function addSessionNote(notes: SessionNote[], text: string, cap = 120) {
  const trimmed = text.trim();
  if (!trimmed) {
    return notes;
  }
  const next = sortSessionNotes([createSessionNote(trimmed), ...notes]);
  return next.slice(0, cap);
}

export function toggleSessionNotePinned(notes: SessionNote[], id: string) {
  const next = notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
  return sortSessionNotes(next);
}

export function deleteSessionNote(notes: SessionNote[], id: string) {
  return notes.filter((note) => note.id !== id);
}

export function notesDigest(notes: SessionNote[]) {
  const pinned = notes.filter((note) => note.pinned).length;
  const recent = notes.slice(0, 3).map((note) => note.text.slice(0, 24));
  return {
    count: notes.length,
    pinned,
    recent,
  };
}
