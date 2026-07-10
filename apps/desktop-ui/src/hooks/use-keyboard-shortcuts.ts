import { useCallback, useEffect } from "react";

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

const hasMeta = (event: KeyboardEvent) => event.metaKey || event.ctrlKey;
const isLowerKey = (event: KeyboardEvent, key: string) => event.key.toLowerCase() === key;

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Meta + K: Command palette
      if (hasMeta(event) && key === "k") {
        event.preventDefault();
        shortcuts.onCommandPalette();
        return;
      }

      // Meta + Z / Meta + Shift + Z / Meta + Y: Undo/Redo
      if (hasMeta(event) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          shortcuts.onRedo();
        } else {
          shortcuts.onUndo();
        }
        return;
      }

      if (hasMeta(event) && key === "y") {
        event.preventDefault();
        shortcuts.onRedo();
        return;
      }

      // Meta + S: Save
      if (hasMeta(event) && key === "s") {
        event.preventDefault();
        shortcuts.onSave();
        return;
      }

      // Meta + D: Duplicate
      if (hasMeta(event) && key === "d") {
        event.preventDefault();
        shortcuts.onDuplicate();
        return;
      }

      // Meta + A: Autosave
      if (hasMeta(event) && key === "a") {
        event.preventDefault();
        shortcuts.onAutosave();
        return;
      }

      // Function keys
      switch (event.key) {
        case "F5":
          event.preventDefault();
          shortcuts.onRunDrc();
          return;
        case "F6":
          event.preventDefault();
          shortcuts.onRunRoute();
          return;
        case "F7":
          event.preventDefault();
          shortcuts.onRunSimulation();
          return;
        case "F8":
          event.preventDefault();
          shortcuts.onRunQualitySuite();
          return;
      }

      // Arrow keys with Shift: Pan
      if (event.shiftKey) {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            shortcuts.onPanLeft();
            return;
          case "ArrowRight":
            event.preventDefault();
            shortcuts.onPanRight();
            return;
          case "ArrowUp":
            event.preventDefault();
            shortcuts.onPanUp();
            return;
          case "ArrowDown":
            event.preventDefault();
            shortcuts.onPanDown();
            return;
        }
      }

      // Meta + +/-: Zoom
      if (hasMeta(event)) {
        if (event.key === "=") {
          event.preventDefault();
          shortcuts.onZoomIn();
          return;
        }
        if (event.key === "-") {
          event.preventDefault();
          shortcuts.onZoomOut();
          return;
        }
        // Meta + Shift + R: Reset viewport
        if (event.shiftKey && key === "r") {
          event.preventDefault();
          shortcuts.onResetViewport();
          return;
        }
      }

      // G: Toggle snap
      if (key === "g") {
        shortcuts.onToggleSnap();
        return;
      }

      // Escape: Clear selection
      if (event.key === "Escape") {
        shortcuts.onClearSelection();
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
