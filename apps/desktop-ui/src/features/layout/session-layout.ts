import { useMemo } from "react";

export type SessionLayoutSection = {
  id: string;
  label: string;
  className: string;
  order: number;
  visible: boolean;
};

export type SessionLayout = {
  sections: SessionLayoutSection[];
  variant: "focused" | "wide" | "balanced";
};

export function buildSessionLayout(params: {
  hasProject: boolean;
  notesCount: number;
  snapshotsCount: number;
  viewportZoom: number;
}): SessionLayout {
  const { hasProject, notesCount, snapshotsCount, viewportZoom } = params;

  let variant: SessionLayout["variant"] = "balanced";
  if (viewportZoom > 1.5) {
    variant = "focused";
  } else if (notesCount > 8 || snapshotsCount > 8) {
    variant = "wide";
  }

  const sections: SessionLayoutSection[] = [
    { id: "sidebar", label: "Structure", className: "panel-left", order: 1, visible: true },
    { id: "canvas", label: "Canvas", className: "canvas-area", order: 2, visible: hasProject },
    { id: "inspector", label: "Inspector", className: "panel-right", order: 3, visible: true },
    { id: "analysis", label: "Analysis", className: "panel-analysis", order: 4, visible: true },
    { id: "dashboard", label: "Dashboard", className: "panel-dashboard", order: 5, visible: true },
    { id: "quick-actions", label: "Quick Actions", className: "panel-quick-actions", order: 6, visible: true },
    { id: "notes", label: "Notes", className: "panel-notes", order: 7, visible: true },
    {
      id: "viewports",
      label: "Viewports",
      className: "panel-viewports",
      order: 8,
      visible: hasProject,
    },
  ];

  return { sections, variant };
}

export function useSessionLayout(params: {
  hasProject: boolean;
  notesCount: number;
  snapshotsCount: number;
  viewportZoom: number;
}) {
  const { hasProject, notesCount, snapshotsCount, viewportZoom } = params;
  return useMemo(
    () => buildSessionLayout({ hasProject, notesCount, snapshotsCount, viewportZoom }),
    [hasProject, notesCount, snapshotsCount, viewportZoom],
  );
}
