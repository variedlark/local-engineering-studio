import type { CanvasViewportState } from "./ui-store.types";
import type { ViewportSnapshot } from "./panels/viewport-snapshots-panel";

function snapshotId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createViewportSnapshot(name: string, viewport: CanvasViewportState): ViewportSnapshot {
  return {
    id: snapshotId(),
    name: name.trim() || `View ${new Date().toLocaleTimeString()}`,
    createdAt: Date.now(),
    viewport: {
      offsetX: Math.round(viewport.offsetX),
      offsetY: Math.round(viewport.offsetY),
      zoom: Number(viewport.zoom.toFixed(3)),
      showGrid: viewport.showGrid,
      snapToGrid: viewport.snapToGrid,
    },
  };
}

export function addViewportSnapshot(
  snapshots: ViewportSnapshot[],
  viewport: CanvasViewportState,
  name: string,
  cap = 36,
) {
  const next = [createViewportSnapshot(name, viewport), ...snapshots];
  return next.slice(0, cap);
}

export function deleteViewportSnapshot(snapshots: ViewportSnapshot[], id: string) {
  return snapshots.filter((snapshot) => snapshot.id !== id);
}

export function findViewportSnapshot(snapshots: ViewportSnapshot[], id: string) {
  return snapshots.find((snapshot) => snapshot.id === id) ?? null;
}

export function snapshotSummary(snapshot: ViewportSnapshot) {
  return `Zoom ${(snapshot.viewport.zoom * 100).toFixed(0)}% at ${snapshot.viewport.offsetX},${snapshot.viewport.offsetY}`;
}
