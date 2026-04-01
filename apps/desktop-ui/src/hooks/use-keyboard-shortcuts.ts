import { useEffect } from "react";

type Shortcuts = {
  onCommandPalette: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  onAutosave: () => void;
  onRunRoute: () => void;
  onRunDrc: () => void;
  onRunSimulation: () => void;
  onRunQualitySuite: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onPanUp: () => void;
  onPanDown: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetViewport: () => void;
  onToggleSnap: () => void;
  onClearSelection: () => void;
};

function hasMeta(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (hasMeta(event) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        shortcuts.onCommandPalette();
      }
      if (hasMeta(event) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        shortcuts.onUndo();
      }
      if (
        hasMeta(event) &&
        ((event.key.toLowerCase() === "z" && event.shiftKey) || event.key.toLowerCase() === "y")
      ) {
        event.preventDefault();
        shortcuts.onRedo();
      }
      if (hasMeta(event) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        shortcuts.onSave();
      }
      if (hasMeta(event) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        shortcuts.onDuplicate();
      }
      if (hasMeta(event) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        shortcuts.onAutosave();
      }
      if (event.key === "F5") {
        event.preventDefault();
        shortcuts.onRunDrc();
      }
      if (event.key === "F6") {
        event.preventDefault();
        shortcuts.onRunRoute();
      }
      if (event.key === "F7") {
        event.preventDefault();
        shortcuts.onRunSimulation();
      }
      if (event.key === "F8") {
        event.preventDefault();
        shortcuts.onRunQualitySuite();
      }
      if (event.key === "ArrowLeft" && event.shiftKey) {
        event.preventDefault();
        shortcuts.onPanLeft();
      }
      if (event.key === "ArrowRight" && event.shiftKey) {
        event.preventDefault();
        shortcuts.onPanRight();
      }
      if (event.key === "ArrowUp" && event.shiftKey) {
        event.preventDefault();
        shortcuts.onPanUp();
      }
      if (event.key === "ArrowDown" && event.shiftKey) {
        event.preventDefault();
        shortcuts.onPanDown();
      }
      if (hasMeta(event) && event.key === "=") {
        event.preventDefault();
        shortcuts.onZoomIn();
      }
      if (hasMeta(event) && event.key === "-") {
        event.preventDefault();
        shortcuts.onZoomOut();
      }
      if (hasMeta(event) && event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        shortcuts.onResetViewport();
      }
      if (event.key.toLowerCase() === "g") {
        shortcuts.onToggleSnap();
      }
      if (event.key === "Escape") {
        shortcuts.onClearSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
