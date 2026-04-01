import type { SelectionAlignMode, SelectionDistributeAxis } from "./ui-store.types";

export type LayoutComponent = {
  id: string;
  position: { x: number; y: number };
};

function midpoint(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return Math.round((min + max) / 2);
}

function sortedByPosition(components: LayoutComponent[], axis: SelectionDistributeAxis) {
  const sorted = [...components];
  sorted.sort((a, b) =>
    axis === "horizontal" ? a.position.x - b.position.x : a.position.y - b.position.y,
  );
  return sorted;
}

export function applyAlignment(components: LayoutComponent[], mode: SelectionAlignMode) {
  const xs = components.map((component) => component.position.x);
  const ys = components.map((component) => component.position.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const centerX = midpoint(xs);
  const centerY = midpoint(ys);

  return components.map((component) => {
    if (mode === "left") {
      return { componentId: component.id, x: left, y: component.position.y };
    }
    if (mode === "right") {
      return { componentId: component.id, x: right, y: component.position.y };
    }
    if (mode === "top") {
      return { componentId: component.id, x: component.position.x, y: top };
    }
    if (mode === "bottom") {
      return { componentId: component.id, x: component.position.x, y: bottom };
    }
    if (mode === "center_x") {
      return { componentId: component.id, x: centerX, y: component.position.y };
    }
    return { componentId: component.id, x: component.position.x, y: centerY };
  });
}

export function applyDistribution(components: LayoutComponent[], axis: SelectionDistributeAxis) {
  if (components.length <= 2) {
    return components.map((component) => ({
      componentId: component.id,
      x: component.position.x,
      y: component.position.y,
    }));
  }

  const ordered = sortedByPosition(components, axis);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const span =
    axis === "horizontal" ? last.position.x - first.position.x : last.position.y - first.position.y;
  const step = span / (ordered.length - 1);

  return ordered.map((component, index) => {
    if (axis === "horizontal") {
      return {
        componentId: component.id,
        x: first.position.x + step * index,
        y: component.position.y,
      };
    }
    return {
      componentId: component.id,
      x: component.position.x,
      y: first.position.y + step * index,
    };
  });
}
