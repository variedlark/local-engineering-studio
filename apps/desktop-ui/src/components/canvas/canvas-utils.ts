import type { Component, Point } from "../../lib/pcb-types";

export function pointsToString(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function componentSize(component: Component) {
  return component.footprint.package === "QFN"
    ? { width: 16, height: 16 }
    : { width: 9, height: 4.8 };
}
